const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const XLSB_MIME = "application/vnd.ms-excel.sheet.binary.macroEnabled.12";
const OLD_UM = "E27527_RT-BE59_UM_EAA";
const OLD_QSG = "U26937_RT-BE59_folded_EU_QSG_312x450mm_PRINT";
const OLD_SPEC = "https://www.asus.com/networking-iot-servers/wifi-7/all-series/rt-be59/techspec/";
const MODEL_NAME_PLACEHOLDER_PATTERN = /\[Model name\]/g;
const WIFI_PATTERN = /Wi-Fi Radio \((?:2\.4\s*(?:&|,)\s*5|2\.4\s*(?:&|,)\s*5\s*(?:&|,)\s*6)\s*GHz\)/gi;
const BUILT_IN_TEMPLATES = {
  en18031_1: "assets/templates/red-en18031-1-template.xlsx",
  en18031_2: "assets/templates/red-en18031-2-template.xlsb",
};

let analyzedIoSpec = null;

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) ? (0xEDB88320 ^ (value >>> 1)) : (value >>> 1);
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function setStatus(message, isError = false) {
  const node = document.getElementById("statusMessage");
  node.textContent = message;
  node.classList.toggle("is-error", isError);
  node.classList.toggle("is-success", !isError);
}

function setIoSpecSummary(message, isError = false) {
  const node = document.getElementById("ioSpecSummary");
  node.textContent = message;
  node.classList.toggle("is-error", isError);
  node.classList.toggle("is-success", !isError && Boolean(message));
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function columnToNumber(ref) {
  return String(ref || "").toUpperCase().split("").reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0);
}

function cellParts(ref) {
  const match = /^([A-Z]+)(\d+)$/i.exec(String(ref || "").trim());
  if (!match) throw new Error(`Invalid cell reference: ${ref}`);
  return { col: match[1].toUpperCase(), row: Number(match[2]), colIndex: columnToNumber(match[1]) };
}

function computeCrc32(bytes) {
  let crc = 0xFFFFFFFF;
  for (let index = 0; index < bytes.length; index += 1) {
    crc = CRC32_TABLE[(crc ^ bytes[index]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function concatUint8Arrays(chunks) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  chunks.forEach((chunk) => {
    result.set(chunk, offset);
    offset += chunk.length;
  });
  return result;
}

function createZipStore(entries) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const now = new Date();
  const dosTime = ((now.getHours() & 0x1F) << 11) | ((now.getMinutes() & 0x3F) << 5) | Math.floor(now.getSeconds() / 2);
  const dosDate = (((now.getFullYear() - 1980) & 0x7F) << 9) | (((now.getMonth() + 1) & 0x0F) << 5) | (now.getDate() & 0x1F);

  entries.forEach((entry) => {
    const nameBytes = encoder.encode(entry.name);
    const dataBytes = entry.data instanceof Uint8Array ? entry.data : encoder.encode(String(entry.data || ""));
    const crc32 = computeCrc32(dataBytes);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034B50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, dosTime, true);
    localView.setUint16(12, dosDate, true);
    localView.setUint32(14, crc32, true);
    localView.setUint32(18, dataBytes.length, true);
    localView.setUint32(22, dataBytes.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localHeader.set(nameBytes, 30);
    localParts.push(localHeader, dataBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014B50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, dosTime, true);
    centralView.setUint16(14, dosDate, true);
    centralView.setUint32(16, crc32, true);
    centralView.setUint32(20, dataBytes.length, true);
    centralView.setUint32(24, dataBytes.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  });

  const centralOffset = offset;
  const centralBytes = concatUint8Arrays(centralParts);
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  endView.setUint32(0, 0x06054B50, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralBytes.length, true);
  endView.setUint32(16, centralOffset, true);
  return concatUint8Arrays([...localParts, centralBytes, endRecord]);
}

async function inflateRaw(bytes) {
  if (typeof DecompressionStream !== "function") {
    throw new Error("This browser does not support DecompressionStream. Use Chrome or Edge.");
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readZipEntries(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return readZipEntriesFromBytes(bytes, file.name || "workbook.xlsx");
}

async function readZipEntriesFromUrl(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load built-in template: ${url}`);
  }
  return readZipEntriesFromBytes(new Uint8Array(await response.arrayBuffer()), url);
}

function resolveTemplateUrl(templatePath) {
  if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(templatePath);
  }
  return new URL(templatePath, document.baseURI).href;
}

async function readZipEntriesFromBytes(bytes, sourceName) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let index = bytes.length - 22; index >= Math.max(0, bytes.length - 66000); index -= 1) {
    if (view.getUint32(index, true) === 0x06054B50) {
      eocd = index;
      break;
    }
  }
  if (eocd < 0) throw new Error(`${sourceName} is not a readable .xlsx zip.`);
  const entryCount = view.getUint16(eocd + 10, true);
  let centralOffset = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder();
  const entries = [];

  for (let entryIndex = 0; entryIndex < entryCount; entryIndex += 1) {
    if (view.getUint32(centralOffset, true) !== 0x02014B50) throw new Error("Invalid zip central directory.");
    const method = view.getUint16(centralOffset + 10, true);
    const compressedSize = view.getUint32(centralOffset + 20, true);
    const nameLength = view.getUint16(centralOffset + 28, true);
    const extraLength = view.getUint16(centralOffset + 30, true);
    const commentLength = view.getUint16(centralOffset + 32, true);
    const localOffset = view.getUint32(centralOffset + 42, true);
    const name = decoder.decode(bytes.slice(centralOffset + 46, centralOffset + 46 + nameLength));
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.slice(dataOffset, dataOffset + compressedSize);
    const data = method === 0 ? compressed : method === 8 ? await inflateRaw(compressed) : null;
    if (!data) throw new Error(`Unsupported zip compression method ${method} in ${name}.`);
    entries.push({ name, data });
    centralOffset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function detectWorkbookPackageType(entries) {
  if (entries.some((entry) => entry.name === "xl/workbook.xml")) {
    return "xlsx";
  }
  if (entries.some((entry) => entry.name === "xl/workbook.bin")) {
    return "xlsb";
  }
  return "unknown";
}

function textEntry(entries, name) {
  const entry = entries.find((item) => item.name === name);
  if (!entry) throw new Error(`Missing workbook part: ${name}`);
  return new TextDecoder().decode(entry.data);
}

function setTextEntry(entries, name, text) {
  const entry = entries.find((item) => item.name === name);
  if (!entry) throw new Error(`Missing workbook part: ${name}`);
  entry.data = new TextEncoder().encode(text);
}

function getZipEntry(entries, name) {
  const entry = entries.find((item) => item.name === name);
  if (!entry) throw new Error(`Missing workbook part: ${name}`);
  return entry;
}

function resolveSheetPath(entries, sheetName) {
  const packageType = detectWorkbookPackageType(entries);
  if (packageType === "xlsb") {
    throw new Error("This template is .xlsb, not .xlsx. Please convert it to .xlsx first, then upload the converted workbook.");
  }
  if (packageType !== "xlsx") {
    throw new Error("This file is not a supported Excel .xlsx workbook.");
  }
  const workbookXml = textEntry(entries, "xl/workbook.xml");
  const relsXml = textEntry(entries, "xl/_rels/workbook.xml.rels");
  const parser = new DOMParser();
  const workbook = parser.parseFromString(workbookXml, "application/xml");
  const rels = parser.parseFromString(relsXml, "application/xml");
  const sheet = [...workbook.getElementsByTagNameNS("*", "sheet")]
    .find((node) => node.getAttribute("name") === sheetName);
  if (!sheet) throw new Error(`Missing sheet: ${sheetName}`);
  const relId = sheet.getAttribute("r:id");
  const rel = [...rels.getElementsByTagNameNS("*", "Relationship")]
    .find((node) => node.getAttribute("Id") === relId);
  if (!rel) throw new Error(`Missing relationship for sheet: ${sheetName}`);
  const target = rel.getAttribute("Target") || "";
  return target.startsWith("/") ? target.slice(1) : `xl/${target}`.replace(/\/[^/]+\/\.\.\//g, "/");
}

const BIFF12 = {
  row: 0x0000,
  blank: 0x0001,
  string: 0x0007,
  si: 0x0013,
  sheet: 0x019C,
  sst: 0x019F,
  sstEnd: 0x01A0,
  sheetDataEnd: 0x0192,
};

function readBiffRecordId(bytes, offset) {
  let value = 0;
  let nextOffset = offset;
  for (let index = 0; index < 4; index += 1) {
    const byte = bytes[nextOffset];
    nextOffset += 1;
    value += byte * (2 ** (8 * index));
    if ((byte & 0x80) === 0) break;
  }
  return { value, offset: nextOffset };
}

function readBiffRecordLength(bytes, offset) {
  let value = 0;
  let shift = 0;
  let nextOffset = offset;
  for (let index = 0; index < 4; index += 1) {
    const byte = bytes[nextOffset];
    nextOffset += 1;
    value += (byte & 0x7F) * (2 ** shift);
    if ((byte & 0x80) === 0) break;
    shift += 7;
  }
  return { value, offset: nextOffset };
}

function readBiffRecord(bytes, offset) {
  const recordStart = offset;
  const id = readBiffRecordId(bytes, offset);
  const length = readBiffRecordLength(bytes, id.offset);
  const payloadOffset = length.offset;
  const endOffset = payloadOffset + length.value;
  return {
    id: id.value,
    length: length.value,
    recordStart,
    payloadOffset,
    endOffset,
    bytes: bytes.slice(recordStart, endOffset),
  };
}

function encodeBiffRecordLength(length) {
  const bytes = [];
  let value = length;
  do {
    let byte = value & 0x7F;
    value = Math.floor(value / 128);
    if (value) byte |= 0x80;
    bytes.push(byte);
  } while (value);
  return new Uint8Array(bytes);
}

function makeBiffRecord(recordId, payload) {
  const idBytes = recordId < 0x80
    ? new Uint8Array([recordId])
    : new Uint8Array([recordId & 0xFF, Math.floor(recordId / 256)]);
  return concatUint8Arrays([idBytes, encodeBiffRecordLength(payload.length), payload]);
}

function utf16LeBytes(value) {
  const text = String(value ?? "");
  const bytes = new Uint8Array(text.length * 2);
  const view = new DataView(bytes.buffer);
  for (let index = 0; index < text.length; index += 1) {
    view.setUint16(index * 2, text.charCodeAt(index), true);
  }
  return bytes;
}

function readBiffString(bytes, offset) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const length = view.getUint32(offset, true);
  const start = offset + 4;
  const end = start + length * 2;
  return {
    value: new TextDecoder("utf-16le").decode(bytes.slice(start, end)),
    offset: end,
  };
}

function makeSharedStringRecord(value) {
  const textBytes = utf16LeBytes(value);
  const payload = new Uint8Array(1 + 4 + textBytes.length);
  const view = new DataView(payload.buffer);
  view.setUint8(0, 0);
  view.setUint32(1, String(value ?? "").length, true);
  payload.set(textBytes, 5);
  return makeBiffRecord(BIFF12.si, payload);
}

function parseSharedStringsPart(bytes) {
  const strings = [];
  const stringToIndex = new Map();
  let count = 0;
  let uniqueCount = 0;
  let sstPayloadOffset = -1;
  let sstEndOffset = -1;

  for (let offset = 0; offset < bytes.length;) {
    const record = readBiffRecord(bytes, offset);
    if (record.id === BIFF12.sst) {
      const view = new DataView(bytes.buffer, bytes.byteOffset + record.payloadOffset, record.length);
      count = view.getUint32(0, true);
      uniqueCount = view.getUint32(4, true);
      sstPayloadOffset = record.payloadOffset;
    } else if (record.id === BIFF12.si) {
      const text = readBiffString(bytes, record.payloadOffset + 1).value;
      if (!stringToIndex.has(text)) stringToIndex.set(text, strings.length);
      strings.push(text);
    } else if (record.id === BIFF12.sstEnd) {
      sstEndOffset = record.recordStart;
      break;
    }
    offset = record.endOffset;
  }

  if (sstPayloadOffset < 0 || sstEndOffset < 0) {
    throw new Error("Invalid .xlsb shared string table.");
  }
  return { strings, stringToIndex, count, uniqueCount, sstPayloadOffset, sstEndOffset };
}

function appendSharedStrings(entries, values) {
  const entry = getZipEntry(entries, "xl/sharedStrings.bin");
  const parsed = parseSharedStringsPart(entry.data);
  const indexes = new Map();
  const newValues = [];

  values.forEach((value) => {
    const text = String(value ?? "");
    if (indexes.has(text)) return;
    if (parsed.stringToIndex.has(text)) {
      indexes.set(text, parsed.stringToIndex.get(text));
      return;
    }
    indexes.set(text, parsed.strings.length + newValues.length);
    newValues.push(text);
  });

  if (!newValues.length) return indexes;

  const appended = concatUint8Arrays(newValues.map(makeSharedStringRecord));
  const result = new Uint8Array(entry.data.length + appended.length);
  result.set(entry.data.slice(0, parsed.sstEndOffset), 0);
  result.set(appended, parsed.sstEndOffset);
  result.set(entry.data.slice(parsed.sstEndOffset), parsed.sstEndOffset + appended.length);

  const view = new DataView(result.buffer);
  view.setUint32(parsed.sstPayloadOffset, parsed.count + newValues.length, true);
  view.setUint32(parsed.sstPayloadOffset + 4, parsed.uniqueCount + newValues.length, true);
  entry.data = result;
  return indexes;
}

function resolveXlsbSheetPaths(entries) {
  const workbook = getZipEntry(entries, "xl/workbook.bin").data;
  const relsXml = textEntry(entries, "xl/_rels/workbook.bin.rels");
  const rels = new DOMParser().parseFromString(relsXml, "application/xml");
  const relMap = new Map([...rels.getElementsByTagNameNS("*", "Relationship")]
    .map((node) => [node.getAttribute("Id"), node.getAttribute("Target") || ""]));
  const sheetPaths = new Map();

  for (let offset = 0; offset < workbook.length;) {
    const record = readBiffRecord(workbook, offset);
    if (record.id === BIFF12.sheet) {
      let payloadOffset = record.payloadOffset + 8;
      const relId = readBiffString(workbook, payloadOffset);
      payloadOffset = relId.offset;
      const sheetName = readBiffString(workbook, payloadOffset).value;
      const target = relMap.get(relId.value);
      if (target) {
        sheetPaths.set(sheetName, target.startsWith("/") ? target.slice(1) : `xl/${target}`.replace(/\/[^/]+\/\.\.\//g, "/"));
      }
    }
    offset = record.endOffset;
  }
  return sheetPaths;
}

function makeXlsbStringCellRecord(colIndex, style, sharedStringIndex) {
  const payload = new Uint8Array(12);
  const view = new DataView(payload.buffer);
  view.setUint32(0, colIndex - 1, true);
  view.setUint32(4, style, true);
  view.setUint32(8, sharedStringIndex, true);
  return makeBiffRecord(BIFF12.string, payload);
}

function patchXlsbSheetCells(entries, sheetPath, updates) {
  const entry = getZipEntry(entries, sheetPath);
  const updatesByKey = new Map(updates.map((update) => [`${update.row}:${update.col}`, update]));
  const chunks = [];
  const applied = new Set();
  let currentRow = null;
  let seenCols = new Set();

  const flushMissingForRow = () => {
    if (!currentRow) return;
    const missing = updates
      .filter((update) => update.row === currentRow && !applied.has(`${update.row}:${update.col}`) && !seenCols.has(update.col))
      .sort((left, right) => left.col - right.col);
    missing.forEach((update) => {
      chunks.push(makeXlsbStringCellRecord(update.col, update.style ?? 0, update.sharedStringIndex));
      applied.add(`${update.row}:${update.col}`);
    });
  };

  for (let offset = 0; offset < entry.data.length;) {
    const record = readBiffRecord(entry.data, offset);
    if (record.id === BIFF12.row) {
      flushMissingForRow();
      const view = new DataView(entry.data.buffer, entry.data.byteOffset + record.payloadOffset, record.length);
      currentRow = view.getUint32(0, true) + 1;
      seenCols = new Set();
      chunks.push(record.bytes);
    } else if (record.id >= BIFF12.blank && record.id <= 0x000B && currentRow) {
      const view = new DataView(entry.data.buffer, entry.data.byteOffset + record.payloadOffset, record.length);
      const col = view.getUint32(0, true) + 1;
      const style = record.length >= 8 ? view.getUint32(4, true) : 0;
      seenCols.add(col);
      const update = updatesByKey.get(`${currentRow}:${col}`);
      if (update) {
        chunks.push(makeXlsbStringCellRecord(col, style, update.sharedStringIndex));
        applied.add(`${currentRow}:${col}`);
      } else {
        chunks.push(record.bytes);
      }
    } else if (record.id === BIFF12.sheetDataEnd) {
      flushMissingForRow();
      currentRow = null;
      chunks.push(record.bytes);
    } else {
      chunks.push(record.bytes);
    }
    offset = record.endOffset;
  }

  const missing = updates.filter((update) => !applied.has(`${update.row}:${update.col}`));
  if (missing.length) {
    throw new Error(`Could not patch .xlsb cells: ${missing.map((item) => `${item.row}:${item.col}`).join(", ")}`);
  }
  entry.data = concatUint8Arrays(chunks);
}

function patchXlsbWorkbook(entries, values) {
  const sheetPaths = resolveXlsbSheetPaths(entries);
  const coverPath = sheetPaths.get("Cover");
  const interfacesPath = sheetPaths.get("Interfaces");
  if (!coverPath || !interfacesPath) {
    throw new Error("The .xlsb template is missing Cover or Interfaces sheet.");
  }

  const coverUpdates = [
    { row: 6, col: 2, value: values.modelName },
    { row: 7, col: 2, value: values.modelName },
    { row: 88, col: 1, value: values.um },
    { row: 88, col: 2, value: values.qsg },
    { row: 90, col: 1, value: values.spec },
  ];
  const interfaceUpdates = [
    { row: 3, col: 2, value: values.wifi },
  ];

  if (values.ioSpec?.lanOverview) interfaceUpdates.push({ row: 4, col: 6, value: values.ioSpec.lanOverview });
  if (values.ioSpec?.wanOverview) interfaceUpdates.push({ row: 5, col: 6, value: values.ioSpec.wanOverview });
  if (values.ioSpec?.buttonsOverview) {
    interfaceUpdates.push({ row: 7, col: 2, value: "Physical Buttons" });
    interfaceUpdates.push({ row: 7, col: 6, value: values.ioSpec.buttonsOverview });
  }
  if (values.ioSpec?.hasUsb && values.ioSpec.usbOverview) {
    interfaceUpdates.push({ row: 8, col: 1, value: "Interface-06" });
    interfaceUpdates.push({ row: 8, col: 2, value: "USB Port" });
    interfaceUpdates.push({ row: 8, col: 3, value: "Physical external interface" });
    interfaceUpdates.push({ row: 8, col: 4, value: "Public" });
    interfaceUpdates.push({ row: 8, col: 5, value: "ASUS Router HW information in Spec" });
    interfaceUpdates.push({ row: 8, col: 6, value: values.ioSpec.usbOverview, style: 15 });
  }

  const allValues = [...coverUpdates, ...interfaceUpdates].map((update) => update.value);
  const sharedStringIndexes = appendSharedStrings(entries, allValues);
  const withIndexes = (update) => ({
    ...update,
    sharedStringIndex: sharedStringIndexes.get(String(update.value ?? "")),
  });
  patchXlsbSheetCells(entries, coverPath, coverUpdates.map(withIndexes));
  patchXlsbSheetCells(entries, interfacesPath, interfaceUpdates.map(withIndexes));
}

function upsertInlineStringCell(sheetXml, ref, value) {
  const { row, colIndex } = cellParts(ref);
  const rowRegex = new RegExp(`<row\\b[^>]*\\br="${row}"[^>]*>[\\s\\S]*?<\\/row>`);
  const cellXml = `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
  const replaceCell = (rowXml) => {
    const cellRegex = new RegExp(`<c\\b[^>]*\\br="${ref}"[^>]*(?:\\/>|>[\\s\\S]*?<\\/c>)`);
    if (cellRegex.test(rowXml)) return rowXml.replace(cellRegex, cellXml);
    const cells = [...rowXml.matchAll(/<c\b[^>]*\br="([A-Z]+)\d+"[^>]*>[\s\S]*?<\/c>/g)];
    const insertBefore = cells.find((match) => columnToNumber(match[1]) > colIndex);
    if (insertBefore) return rowXml.replace(insertBefore[0], `${cellXml}${insertBefore[0]}`);
    return rowXml.replace("</row>", `${cellXml}</row>`);
  };

  if (rowRegex.test(sheetXml)) return sheetXml.replace(rowRegex, replaceCell);
  const newRow = `<row r="${row}">${cellXml}</row>`;
  const rows = [...sheetXml.matchAll(/<row\b[^>]*\br="(\d+)"[^>]*>[\s\S]*?<\/row>/g)];
  const insertBefore = rows.find((match) => Number(match[1]) > row);
  if (insertBefore) return sheetXml.replace(insertBefore[0], `${newRow}${insertBefore[0]}`);
  return sheetXml.replace("</sheetData>", `${newRow}</sheetData>`);
}

function sanitizeFileSegment(value, fallback = "Model-name") {
  const cleaned = String(value || "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || fallback;
}

function inferModelNameFromText(value) {
  const text = String(value || "");
  const proArtTitleMatch = /\b(ProArt\s+Router\s+PRT-[A-Z0-9-]+)\b/i.exec(text);
  if (proArtTitleMatch?.[1]) {
    return proArtTitleMatch[1]
      .replace(/\s+/g, " ")
      .replace(/^proart router/i, "ProArt Router")
      .replace(/\bprt-[a-z0-9-]+/i, (match) => match.toUpperCase());
  }
  const standalonePrtMatch = /\b(PRT-[A-Z0-9-]+)\b/i.exec(text);
  if (standalonePrtMatch?.[1]) {
    return standalonePrtMatch[1].toUpperCase();
  }
  const patterns = [
    /\/([a-z]{1,8}-[a-z0-9-]+?)(?:-model)?\/(?:spec|techspec)?\/?$/i,
    /\/([a-z]{1,8}-[a-z0-9-]+?)-model\//i,
    /\b((?:RT|GT|TUF|ZenWiFi|ExpertWiFi|EBG|EBA|ET|XD|XT|BT|BQ|GS)[A-Z0-9-]{2,})\b/i,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match?.[1]) {
      return match[1]
        .replace(/^rog-rapture-gt-/i, "GT-")
        .replace(/^rog-rapture-/i, "")
        .replace(/-model$/i, "")
        .toUpperCase();
    }
  }
  return "";
}

async function applyInitialUrlParameters() {
  const params = new URLSearchParams(window.location.search || "");
  const specUrl = params.get("spec") || "";
  const pageTitle = params.get("title") || "";
  const inferredModel = inferModelNameFromText(pageTitle) || inferModelNameFromText(specUrl);
  if (inferredModel) {
    document.getElementById("modelNameValue").value = inferredModel;
  }
  if (specUrl) {
    document.getElementById("specValue").value = specUrl;
    try {
      setIoSpecSummary("Analyzing spec URL...");
      await analyzeSpecUrl();
    } catch (error) {
      setIoSpecSummary(error instanceof Error ? error.message : "Failed to analyze spec URL.", true);
    }
  }
}

function normalizePortSpeed(value) {
  return String(value || "")
    .replace(/\b(\d+(?:\.\d+)?)\s*G\s*BaseT\b/gi, "$1G")
    .replace(/\bGigabits?\s+BaseT\b/gi, "1G")
    .replace(/\b(\d+(?:\.\d+)?)\s*GbE\b/gi, "$1G")
    .replace(/\b(\d+(?:\.\d+)?)\s*Gbps\b/gi, "$1G")
    .replace(/\b10Gbps\b/gi, "10G")
    .replace(/\b2\.5Gbps\b/gi, "2.5G")
    .replace(/\b2\.5\s+Gbps\b/gi, "2.5G")
    .replace(/\b10\/100\/1000Mbps\b/gi, "1G")
    .replace(/\b1000Mbps\b/gi, "1G")
    .replace(/\bGigabits?\b/gi, "1G")
    .replace(/\bBase-?T\b/gi, "")
    .replace(/\bRJ45\s+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

const PORT_SPEED_PATTERN = String.raw`(?:10\/100\/1000\s*Mbps|\d+(?:\.\d+)?\s*(?:Gbps|GbE|G)\b|Gigabits?(?:\s+BaseT)?|Gigabit\s+Ethernet)`;
const PORT_ROLE_PATTERN = String.raw`(?:WAN\s*\/\s*LAN|WAN|LAN)`;

function normalizePortRole(value) {
  const role = String(value || "").trim().toUpperCase();
  if (/\bWAN\s*\/\s*LAN\b/.test(role)) return "WAN/LAN";
  if (/\bWAN\b/.test(role)) return "WAN";
  return "LAN";
}

function inferPortRoleFromText(value) {
  const text = String(value || "").toUpperCase();
  if (/\bWAN\s*\/\s*LAN\b/.test(text)) return "WAN/LAN";
  if (/\bWAN\b/.test(text)) return "WAN";
  if (/\bLAN\b/.test(text)) return "LAN";
  return "";
}

function formatPortItem(item) {
  return `${item.count} x ${normalizePortSpeed(item.spec)} ${normalizePortRole(item.role)}`;
}

function formatPortOverview(items) {
  return items.map(formatPortItem).join(", ");
}

function normalizeIoPortText(rawText) {
  return String(rawText || "")
    .replace(/\u00a0/g, " ")
    .replace(/([A-Za-z])x(\d+)/g, "$1 x $2")
    .replace(/([0-9])x(\d+)/g, "$1 x $2");
}

function addNetworkPort(ports, count, spec, role) {
  const normalizedCount = Number(count);
  const normalizedSpec = normalizePortSpeed(spec);
  const normalizedRole = normalizePortRole(role);
  if (!Number.isFinite(normalizedCount) || normalizedCount <= 0 || !normalizedSpec || !normalizedRole) {
    return false;
  }
  const key = `${normalizedCount}|${normalizedSpec}|${normalizedRole}`;
  if (ports.some((item) => `${item.count}|${normalizePortSpeed(item.spec)}|${normalizePortRole(item.role)}` === key)) {
    return false;
  }
  ports.push({ count: normalizedCount, spec: normalizedSpec, role: normalizedRole });
  return true;
}

function scanNetworkPortMentions(rawText, networkPorts) {
  const text = normalizeIoPortText(rawText).replace(/\s+/g, " ").trim();
  const scans = [
    {
      regex: new RegExp(`RJ45\\s+for\\s+(${PORT_SPEED_PATTERN})\\s+for\\s+(${PORT_ROLE_PATTERN})\\s*x\\s*(\\d+)`, "gi"),
      apply: (match) => addNetworkPort(networkPorts, match[3], match[1], match[2]),
    },
    {
      regex: new RegExp(`(${PORT_SPEED_PATTERN})\\s+(${PORT_ROLE_PATTERN})\\s*(?:port|ports)?\\s*x\\s*(\\d+)`, "gi"),
      apply: (match) => addNetworkPort(networkPorts, match[3], match[1], match[2]),
    },
    {
      regex: new RegExp(`(\\d+)\\s*x\\s*(?:RJ45\\s+)?(${PORT_SPEED_PATTERN})\\s+(?:for\\s+)?(${PORT_ROLE_PATTERN})`, "gi"),
      apply: (match) => addNetworkPort(networkPorts, match[1], match[2], match[3]),
    },
    {
      regex: new RegExp(`(${PORT_SPEED_PATTERN})\\s*x\\s*(\\d+)\\s*\\(([^)]*?(?:WAN|LAN)[^)]*)\\)`, "gi"),
      apply: (match) => addNetworkPort(networkPorts, match[2], match[1], inferPortRoleFromText(match[3])),
    },
  ];
  scans.forEach(({ regex, apply }) => {
    let match;
    while ((match = regex.exec(text))) {
      apply(match);
    }
  });
}

function splitIoPortItems(rawText) {
  const normalized = normalizeIoPortText(rawText)
    .replace(/,/g, "\n")
    .replace(/(?=\bRJ45\s+for\s+.+?\s+for\s+(?:WAN\/LAN|WAN|LAN)\s*x\s*\d+\b)/gi, "\n")
    .replace(/(?=\bUSB(?:[-\s][A-Za-z0-9.]+)?(?:\s+.+?)?\s*x\s*\d+\b)/gi, "\n")
    .replace(/(?=(?<![\d.])\b\d+\s*x\s+(?:RJ45\s+)?(?:\d+(?:\.\d+)?\s*(?:Gbps|GbE|G)|10\/100\/1000Mbps|USB)\b)/gi, "\n")
    .replace(/(?=\b(?:USB\s+[A-Za-z0-9./+\- ]+?|(?<![\d.])\b(?:\d+(?:\.\d+)?\s*(?:Gbps|GbE|G)|10\/100\/1000Mbps)\s+(?:WAN\/LAN|WAN|LAN))\s*x\s*\d+\b)/gi, "\n");
  return normalized
    .split(/\n+/)
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function parseIoPortsText(rawText) {
  const text = normalizeIoPortText(rawText).replace(/\s+/g, " ").trim();
  if (!text) {
    return null;
  }

  const networkPorts = [];
  const usbPorts = [];
  splitIoPortItems(text).forEach((item) => {
    let match = /^(\d+)\s*x\s*(.+?)\s+for\s+(WAN\/LAN|WAN|LAN)$/i.exec(item);
    if (match) {
      addNetworkPort(networkPorts, match[1], match[2], match[3]);
      return;
    }

    match = /^RJ45\s+for\s+(.+?)\s+for\s+(WAN\/LAN|WAN|LAN)\s*x\s*(\d+)$/i.exec(item);
    if (match) {
      addNetworkPort(networkPorts, match[3], match[1], match[2]);
      return;
    }

    match = /^(\d+)\s*x\s*((?:RJ45\s+)?(?:\d+(?:\.\d+)?\s*(?:Gbps|GbE|G)|10\/100\/1000Mbps))\s+(WAN\/LAN|WAN|LAN)$/i.exec(item);
    if (match) {
      addNetworkPort(networkPorts, match[1], match[2], match[3]);
      return;
    }

    match = /^(\d+)\s*x\s*(\d+(?:\.\d+)?\s*Gbps)\s*SFP\+\s*Port$/i.exec(item);
    if (match) {
      addNetworkPort(networkPorts, match[1], `${normalizePortSpeed(match[2])} SFP+`, "LAN");
      return;
    }

    match = /^((?:\d+(?:\.\d+)?\s*(?:Gbps|GbE|G)|10\/100\/1000Mbps))\s+(WAN\/LAN|WAN|LAN)\s*x\s*(\d+)$/i.exec(item);
    if (match) {
      addNetworkPort(networkPorts, match[3], match[1], match[2]);
      return;
    }

    match = /^((?:\d+(?:\.\d+)?\s*(?:Gbps|GbE|G)|10\/100\/1000Mbps))\s*x\s*(\d+)\s*(?:\((.+?)\)|(.+?))?$/i.exec(item);
    if (match) {
      const role = inferPortRoleFromText(`${match[3] || ""} ${match[4] || ""}`);
      if (role) {
        addNetworkPort(networkPorts, match[2], match[1], role);
        return;
      }
    }

    match = /((?:RJ45\s+for\s+)?(?:\d+(?:\.\d+)?\s*(?:Gbps|GbE|G)(?:\s*BaseT)?|Gigabits?\s+BaseT|10\/100\/1000Mbps))\s*x\s*(\d+)/i.exec(item);
    if (match) {
      const role = inferPortRoleFromText(item);
      if (role) {
        addNetworkPort(networkPorts, match[2], match[1], role);
        return;
      }
    }

    match = /^(\d+)\s*x\s*(USB\s+.+)$/i.exec(item);
    if (match) {
      usbPorts.push({ count: Number(match[1]), spec: String(match[2] || "").replace(/\s+/g, " ").trim() });
      return;
    }

    match = /^(USB\s+.+?)\s*x\s*(\d+)$/i.exec(item);
    if (match) {
      usbPorts.push({ count: Number(match[2]), spec: String(match[1] || "").replace(/\s+/g, " ").trim() });
      return;
    }

    match = /^(USB(?:[-\s][A-Za-z0-9.]+)?(?:\s+.+?)?)\s*x\s*(\d+)$/i.exec(item);
    if (match) {
      usbPorts.push({ count: Number(match[2]), spec: String(match[1] || "").replace(/\s+/g, " ").trim() });
    }
  });
  scanNetworkPortMentions(text, networkPorts);

  const lanPorts = networkPorts.filter((item) => item.role === "LAN" || item.role === "WAN/LAN");
  const wanPorts = networkPorts.filter((item) => item.role === "WAN" || item.role === "WAN/LAN");

  return {
    rawText: text,
    lanOverview: formatPortOverview(lanPorts),
    wanOverview: formatPortOverview(wanPorts),
    usbOverview: usbPorts.map((item) => `${item.count} x ${item.spec}`).join(", "),
    hasUsb: usbPorts.length > 0,
  };
}

function inferWifiRadioFromSpecText(rawText) {
  const text = String(rawText || "").replace(/\s+/g, " ").trim();
  if (/\b6\s*G\s*Hz\b/i.test(text)) {
    return "Wi-Fi Radio (2.4 & 5 & 6GHz)";
  }
  if (/\b2\.4\s*G\s*Hz\b/i.test(text) && /\b5\s*G\s*Hz\b/i.test(text)) {
    return "Wi-Fi Radio (2.4 & 5GHz)";
  }
  return "";
}

function normalizeVisibleText(value) {
  return String(value || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function visibleTextFromNode(node) {
  const clone = node.cloneNode(true);
  clone.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  clone.querySelectorAll("p,li,div").forEach((element) => element.append("\n"));
  return normalizeVisibleText(clone.textContent || "");
}

function visibleTextFromHtml(html) {
  return normalizeVisibleText(String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|li|div|tr|h[1-6])>/gi, "\n")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " "));
}

function extractAsusRowTableValueFromHtml(html, labelPattern) {
  const documentNode = new DOMParser().parseFromString(String(html || ""), "text/html");
  const titleNodes = [...documentNode.querySelectorAll(".rowTableTitle, [class*='rowTableTitle']")];
  const titleNode = titleNodes.find((node) => labelPattern.test(normalizeVisibleText(node.textContent || "")));
  if (!titleNode) {
    return "";
  }

  let rowNode = titleNode.parentElement;
  while (rowNode && rowNode !== documentNode.body) {
    let valueNodes = [...rowNode.querySelectorAll("[class*='rowTableItems']")];
    if (!valueNodes.length) {
      valueNodes = [...rowNode.querySelectorAll("[class*='rowTableItemBox'] p")];
    }
    if (valueNodes.length) {
      const values = valueNodes
        .map(visibleTextFromNode)
        .filter((text) => text && !labelPattern.test(text));
      if (values.length) {
        return values.join(" ");
      }
    }
    rowNode = rowNode.parentElement;
  }
  return "";
}

function extractOperatingFrequencyTextFromHtml(html) {
  const rowValue = extractAsusRowTableValueFromHtml(html, /^Operating\s+Frequency$/i);
  if (rowValue) {
    return rowValue;
  }

  const documentNode = new DOMParser().parseFromString(String(html || ""), "text/html");
  const headings = [...documentNode.querySelectorAll("h1,h2,h3,h4,dt,strong")];
  const frequencyHeading = headings.find((node) => /Operating\s+Frequency/i.test(node.textContent || ""));
  if (frequencyHeading) {
    const parts = [];
    let node = frequencyHeading.nextElementSibling;
    while (node) {
      const tag = String(node.tagName || "").toLowerCase();
      if (/^h[1-4]$/.test(tag) || /Data\s+Rate|Antenna|Transmit|Operating\s+Mode|Processor|Memory|Boosts\s+Speed/i.test(node.textContent || "")) {
        break;
      }
      const text = String(node.textContent || "").replace(/\s+/g, " ").trim();
      if (text) {
        parts.push(text);
      }
      node = node.nextElementSibling;
    }
    if (parts.length) {
      return parts.join(" ");
    }
  }

  const pageText = visibleTextFromHtml(html);
  const match = /Operating\s+Frequency\s+(.+?)(?:\s+Data\s+Rate|\s+Antenna|\s+Transmit\/Receive|\s+Processor|\s+Memory|\s+Boosts\s+Speed|\s+I\/O\s*Ports)/i.exec(pageText);
  return match ? match[1].trim() : "";
}

function extractIoPortsTextFromHtml(html) {
  const rowValue = extractAsusRowTableValueFromHtml(html, /^I\/O\s*Ports$/i);
  if (rowValue) {
    return rowValue;
  }

  const documentNode = new DOMParser().parseFromString(String(html || ""), "text/html");
  const headings = [...documentNode.querySelectorAll("h1,h2,h3,h4,dt,strong")];
  const ioHeading = headings.find((node) => /I\/O\s*Ports/i.test(node.textContent || ""));
  if (ioHeading) {
    const parts = [];
    let node = ioHeading.nextElementSibling;
    while (node) {
      const tag = String(node.tagName || "").toLowerCase();
      if (/^h[1-4]$/.test(tag) || /Buttons/i.test(node.textContent || "")) {
        break;
      }
      const text = String(node.textContent || "").replace(/\s+/g, " ").trim();
      if (text) {
        parts.push(text);
      }
      node = node.nextElementSibling;
    }
    if (parts.length) {
      return parts.join(" ");
    }
  }

  const pageText = visibleTextFromHtml(html);
  const fallback = /I\/O\s*Ports\s+(.+?)(?:\s+Buttons\s+|\s+LED Indicator\s+|\s+Power Supply\s+)/i.exec(pageText);
  if (fallback) {
    return fallback[1].trim();
  }
  const lowerText = pageText.toLowerCase();
  const startIndex = lowerText.indexOf("i/o ports");
  if (startIndex >= 0) {
    const afterStart = pageText.slice(startIndex + "i/o ports".length).trim();
    const endMatch = /\b(Buttons|LED Indicator|Power Supply|Package Content)\b/i.exec(afterStart);
    return (endMatch ? afterStart.slice(0, endMatch.index) : afterStart.slice(0, 500)).trim();
  }
  return "";
}

function extractButtonsTextFromHtml(html) {
  const rowValue = extractAsusRowTableValueFromHtml(html, /^Buttons$/i);
  if (rowValue) {
    return rowValue;
  }

  const documentNode = new DOMParser().parseFromString(String(html || ""), "text/html");
  const headings = [...documentNode.querySelectorAll("h1,h2,h3,h4,dt,strong")];
  const buttonsHeading = headings.find((node) => /^Buttons$/i.test(String(node.textContent || "").trim()));
  if (buttonsHeading) {
    const parts = [];
    let node = buttonsHeading.nextElementSibling;
    while (node) {
      const tag = String(node.tagName || "").toLowerCase();
      if (/^h[1-4]$/.test(tag) || /LED Indicator|Power Supply|Package Content/i.test(node.textContent || "")) {
        break;
      }
      const text = String(node.textContent || "").replace(/\s+/g, " ").trim();
      if (text) {
        parts.push(text);
      }
      node = node.nextElementSibling;
    }
    if (parts.length) {
      return parts.join(" ");
    }
  }

  const pageText = visibleTextFromHtml(html);
  const fallback = /Buttons\s+(.+?)(?:\s+LED Indicator\s+|\s+Power Supply\s+|\s+Package Content\s+)/i.exec(pageText);
  return fallback ? fallback[1].trim() : "";
}

async function analyzeSpecUrl() {
  const url = document.getElementById("specValue").value.trim();
  if (!url) {
    throw new Error("Please paste the official spec URL first.");
  }
  const response = await fetch(url, { credentials: "omit" });
  if (!response.ok) {
    throw new Error(`Failed to fetch spec URL: HTTP ${response.status}`);
  }
  const html = await response.text();
  const ioText = extractIoPortsTextFromHtml(html);
  const parsed = parseIoPortsText(ioText);
  if (!parsed || (!parsed.lanOverview && !parsed.wanOverview && !parsed.usbOverview)) {
    throw new Error("Could not find I/O Ports from this spec page.");
  }
  const frequencyText = extractOperatingFrequencyTextFromHtml(html);
  const pageText = String(new DOMParser().parseFromString(html, "text/html").body?.textContent || "");
  const inferredWifi = frequencyText
    ? inferWifiRadioFromSpecText(frequencyText)
    : inferWifiRadioFromSpecText(pageText);
  if (inferredWifi) {
    document.getElementById("wifiValue").value = inferredWifi;
    parsed.wifi = inferredWifi;
  }
  const buttonsText = extractButtonsTextFromHtml(html);
  if (buttonsText) {
    parsed.buttonsOverview = buttonsText;
  }
  analyzedIoSpec = parsed;
  setIoSpecSummary([
    parsed.wifi ? `Wi-Fi: ${parsed.wifi}` : "",
    parsed.lanOverview ? `LAN: ${parsed.lanOverview}` : "",
    parsed.wanOverview ? `WAN: ${parsed.wanOverview}` : "",
    parsed.usbOverview ? `USB: ${parsed.usbOverview}` : "",
    parsed.buttonsOverview ? `Buttons: ${parsed.buttonsOverview}` : "",
  ].filter(Boolean).join(" | "));
  return parsed;
}

function patchAllXmlText(entries, values) {
  const replacements = [
    [OLD_UM, values.um],
    [OLD_QSG, values.qsg],
    [OLD_SPEC, values.spec],
  ];
  entries.forEach((entry) => {
    if (!entry.name.endsWith(".xml")) return;
    let text = new TextDecoder().decode(entry.data);
    replacements.forEach(([from, to]) => {
      text = text.split(escapeXml(from)).join(escapeXml(to));
      text = text.split(from).join(to);
    });
    text = text.replace(WIFI_PATTERN, values.wifi);
    text = text.replace(MODEL_NAME_PLACEHOLDER_PATTERN, values.modelName);
    entry.data = new TextEncoder().encode(text);
  });
}

function patchWorkbook(entries, values, options = {}) {
  patchAllXmlText(entries, values);
  const coverPath = resolveSheetPath(entries, "Cover");
  const interfacesPath = resolveSheetPath(entries, "Interfaces");
  let coverXml = textEntry(entries, coverPath);
  coverXml = upsertInlineStringCell(coverXml, "B6", values.modelName);
  coverXml = upsertInlineStringCell(coverXml, "B7", values.modelName);
  if (options.patchCoverDocumentRefs !== false) {
    coverXml = upsertInlineStringCell(coverXml, "A88", values.um);
    coverXml = upsertInlineStringCell(coverXml, "B88", values.qsg);
    coverXml = upsertInlineStringCell(coverXml, "A90", values.spec);
  }
  setTextEntry(entries, coverPath, coverXml);

  let interfacesXml = textEntry(entries, interfacesPath);
  interfacesXml = upsertInlineStringCell(interfacesXml, "B3", values.wifi);
  if (values.ioSpec?.lanOverview) {
    interfacesXml = upsertInlineStringCell(interfacesXml, "F4", values.ioSpec.lanOverview);
  }
  if (values.ioSpec?.wanOverview) {
    interfacesXml = upsertInlineStringCell(interfacesXml, "F5", values.ioSpec.wanOverview);
  }
  if (values.ioSpec?.buttonsOverview) {
    interfacesXml = upsertInlineStringCell(interfacesXml, "B7", "Physical Buttons");
    interfacesXml = upsertInlineStringCell(interfacesXml, "F7", values.ioSpec.buttonsOverview);
  }
  if (values.ioSpec?.hasUsb && values.ioSpec.usbOverview) {
    interfacesXml = upsertInlineStringCell(interfacesXml, "A8", "Interface-06");
    interfacesXml = upsertInlineStringCell(interfacesXml, "B8", "USB Port");
    interfacesXml = upsertInlineStringCell(interfacesXml, "C8", "Physical external interface");
    interfacesXml = upsertInlineStringCell(interfacesXml, "D8", "Public");
    interfacesXml = upsertInlineStringCell(interfacesXml, "E8", "ASUS Router HW information in Spec");
    interfacesXml = upsertInlineStringCell(interfacesXml, "F8", values.ioSpec.usbOverview);
  }
  setTextEntry(entries, interfacesPath, interfacesXml);

  if (entries.some((entry) => entry.name === "xl/workbook.xml")) {
    let workbookXml = textEntry(entries, "xl/workbook.xml");
    if (/<calcPr\b/.test(workbookXml)) {
      workbookXml = workbookXml.replace(/<calcPr\b[^>]*(?:\/>|>[\s\S]*?<\/calcPr>)/, '<calcPr fullCalcOnLoad="1" forceFullCalc="1"/>');
    } else {
      workbookXml = workbookXml.replace("</workbook>", '<calcPr fullCalcOnLoad="1" forceFullCalc="1"/></workbook>');
    }
    setTextEntry(entries, "xl/workbook.xml", workbookXml);
  }
}

function downloadBytes(filename, bytes, mimeType = XLSX_MIME) {
  const url = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function timestampForFile() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function getValues() {
  const modelName = document.getElementById("modelNameValue").value.trim();
  const um = document.getElementById("umValue").value.trim();
  const qsg = document.getElementById("qsgValue").value.trim();
  const spec = document.getElementById("specValue").value.trim();
  const wifi = document.getElementById("wifiValue").value;
  if (!modelName || !um || !qsg || !spec) throw new Error("Model name, UM, QSG, and Spec are required.");
  return { modelName, um, qsg, spec, wifi, ioSpec: analyzedIoSpec };
}

async function generateWorkbookFromBuiltin(templatePath, outputName, values, options = {}) {
  const url = resolveTemplateUrl(templatePath);
  const entries = await readZipEntriesFromUrl(url);
  patchWorkbook(entries, values, options);
  downloadBytes(outputName, createZipStore(entries));
}

async function generateXlsbWorkbookFromBuiltin(templatePath, outputName, values) {
  const url = resolveTemplateUrl(templatePath);
  const entries = await readZipEntriesFromUrl(url);
  patchXlsbWorkbook(entries, values);
  downloadBytes(outputName, createZipStore(entries), XLSB_MIME);
}

document.getElementById("fillExampleButton").addEventListener("click", () => {
  document.getElementById("modelNameValue").value = "RT-BE59";
  document.getElementById("umValue").value = OLD_UM;
  document.getElementById("qsgValue").value = OLD_QSG;
  document.getElementById("specValue").value = OLD_SPEC;
});

document.getElementById("specValue").addEventListener("input", () => {
  analyzedIoSpec = null;
  setIoSpecSummary("I/O spec 尚未分析。");
});

document.getElementById("analyzeSpecButton").addEventListener("click", async () => {
  try {
    setIoSpecSummary("Analyzing spec URL...");
    await analyzeSpecUrl();
  } catch (error) {
    analyzedIoSpec = null;
    setIoSpecSummary(error instanceof Error ? error.message : "Failed to analyze spec URL.", true);
  }
});

document.getElementById("generateButton").addEventListener("click", async () => {
  try {
    setStatus("Generating...");
    const values = getValues();
    if (!values.ioSpec && values.spec) {
      try {
        setIoSpecSummary("Analyzing spec URL...");
        values.ioSpec = await analyzeSpecUrl();
      } catch (error) {
        setIoSpecSummary(error instanceof Error ? error.message : "I/O spec analysis skipped.", true);
      }
    }
    const stamp = timestampForFile();
    const modelName = sanitizeFileSegment(values.modelName);
    await generateWorkbookFromBuiltin(
      BUILT_IN_TEMPLATES.en18031_1,
      `${stamp}-RED-DA-EN-18031-1-Conceptual-Assessment-Decision-ASUS-Router_${modelName}.xlsx`,
      values,
      { patchCoverDocumentRefs: true }
    );
    await generateXlsbWorkbookFromBuiltin(
      BUILT_IN_TEMPLATES.en18031_2,
      `${stamp}-RED-18031-2-ASUS-Router_${modelName}.xlsb`,
      values
    );
    setStatus("Done. Two Excel files were downloaded.");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Failed to generate Excel files.", true);
  }
});

applyInitialUrlParameters().catch((error) => {
  setIoSpecSummary(error instanceof Error ? error.message : "Failed to apply page context.", true);
});
