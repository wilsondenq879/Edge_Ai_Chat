const DEFAULT_MULTI_PERSPECTIVE_PROFILES = [
  "Summarizer|Extract the key facts, context, and conclusion.",
  "Skeptic|Challenge assumptions, missing evidence, and weak points.",
  "Action Advisor|Recommend practical next steps and decisions.",
].join("\n");
const LOCAL_DB_NAME = "edge-ai-chat-local-db";
const LOCAL_DB_VERSION = 1;
const LOCAL_DB_STORE = "kv";
const WORK_FOLDER_HANDLE_KEY = "work-folder-handle";
const LOCAL_META_KEY = "localWorkFolderMeta";
const LATEST_CHAT_SESSION_KEY = "latestChatSession";
const EXPORT_SEQUENCE_KEY = "chatExportSequence";
const TASKS_STORAGE_KEY = "taskReminderItems";
const WATCHTOWER_MONITORS_STORAGE_KEY = "watchtowerMonitorsV1";
const WATCHTOWER_EVENTS_STORAGE_KEY = "watchtowerEventsV1";
const BATCH_URL_QA_JOBS_KEY = "batchUrlQaJobs";
const BATCH_URL_QA_OUTPUT_FORMATS = {
  jsonl: "jsonl",
  txt: "txt",
};
const GOOGLE_DRIVE_SYNC_META_KEY = "googleDriveSyncMeta";
const GOOGLE_DRIVE_SYNC_DOCUMENTS_KEY = "googleDriveSyncDocuments";
const GOOGLE_DRIVE_SYNC_FILE_NAME = "edge-ai-chat-sync.json";
const GOOGLE_DRIVE_SYNC_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const GOOGLE_DRIVE_SYNC_VERSION = 1;
const MAX_GOOGLE_DRIVE_SYNC_DOCUMENTS = 50;
const WORK_FOLDER_SKILL_DIR = "skill";
const WORK_FOLDER_TASK_DIR = "task";
const WORK_FOLDER_SYNC_DIR = "sync";
const WORK_FOLDER_DATASET_DIR = "dataset";
const workFolderTransferSessions = new Map();
const WORK_FOLDER_STARTERS_FILE = "starter-skills.json";
const WORK_FOLDER_TASKS_FILE = "task-reminders.json";
const TASK_ALARM_PREFIX = "task-reminder:";
const TASK_NOTIFICATION_PREFIX = "task-notification:";
const WATCHTOWER_ALARM_PREFIX = "watchtower-monitor:";
const WATCHTOWER_NOTIFICATION_PREFIX = "watchtower-notification:";
const WATCHTOWER_DEFAULT_INTERVAL_MINUTES = 60;
const WATCHTOWER_MIN_INTERVAL_MINUTES = 15;
const WATCHTOWER_MAX_INTERVAL_MINUTES = 10080;
const WATCHTOWER_MAX_MONITORS = 50;
const WATCHTOWER_MAX_EVENTS = 120;
const WATCHTOWER_MAX_BASELINE_TEXT = 16000;
const CONTEXT_MENU_ANALYZE_IMAGE_ID = "open-copilot-analyze-image";
const CONTEXT_MENU_PASTE_SELECTION_ID = "open-copilot-paste-selection";
const SUPPORTED_LOCAL_DOCUMENT_EXTENSIONS = new Set(["txt", "md", "markdown", "json", "csv"]);
const DEFAULT_TASK_EXTRACTION_WINDOW_DAYS = 3;
const MAX_TASK_EXTRACTION_WINDOW_DAYS = 7;
const MAX_BATCH_URL_QA_ITEMS = 100;
const DEFAULT_BATCH_URL_QA_COUNT = 5;
const LOCAL_SECRET_CONFIG_KEY = "providerSecretConfig";
const SECRET_CONFIG_FIELDS = ["githubApiKey", "geminiApiKey", "geminiEmbeddingApiKey", "azureOpenAiApiKey", "azureOpenAiEmbeddingApiKey", "telegramBotToken", "lineChannelAccessToken", "teamsWebhookUrl", "slackWebhookUrl", "discordWebhookUrl"];
const CLIENT_REDACTED_CONFIG_FIELDS = [...SECRET_CONFIG_FIELDS, "lmStudioApiKey", "lmStudioEmbeddingApiKey"];
const watchtowerRunLocks = new Set();

const DEFAULT_SECRET_CONFIG = {
  githubApiKey: "",
  geminiApiKey: "",
  geminiEmbeddingApiKey: "",
  azureOpenAiApiKey: "",
  azureOpenAiEmbeddingApiKey: "",
  telegramBotToken: "",
  lineChannelAccessToken: "",
  teamsWebhookUrl: "",
  slackWebhookUrl: "",
  discordWebhookUrl: "",
};

const DEFAULT_CONFIG = {
  ollamaUrl: "http://127.0.0.1:11434",
  ollamaEmbeddingUrl: "http://127.0.0.1:11434",
  ollamaEmbeddingModel: "",
  lmStudioUrl: "http://127.0.0.1:1234",
  lmStudioEmbeddingUrl: "http://127.0.0.1:1234",
  lmStudioModel: "",
  lmStudioEmbeddingModel: "",
  lmStudioApiKey: "lm-studio",
  lmStudioEmbeddingApiKey: "lm-studio",
  geminiModel: "gemini-2.5-flash",
  geminiEmbeddingModel: "gemini-embedding-001",
  azureOpenAiEndpoint: "",
  azureOpenAiEmbeddingEndpoint: "",
  azureOpenAiDeployment: "",
  azureOpenAiEmbeddingDeployment: "",
  azureOpenAiApiVersion: "2024-10-21",
  azureOpenAiEmbeddingApiVersion: "2024-10-21",
  defaultProvider: "ollama",
  defaultEmbeddingProvider: "ollama",
  selectedModel: "",
  modelSelectionMode: "auto",
  starterModelRoutingEnabled: true,
  starterReasoningModel: "",
  starterVisionModel: "",
  uiLanguage: "zh-TW",
  replyLanguage: "zh-TW",
  settingsTheme: "system",
  chatFontSize: "small",
  taskExtractionWindowDays: DEFAULT_TASK_EXTRACTION_WINDOW_DAYS,
  floatingIconEnabled: true,
  starterHoverTipsEnabled: true,
  teamsInlineActionEnabled: true,
  evidenceModeEnabled: false,
  telegramNotificationEnabled: false,
  telegramChatId: "",
  lineNotificationEnabled: false,
  lineTo: "",
  teamsNotificationEnabled: false,
  slackNotificationEnabled: false,
  discordNotificationEnabled: false,
  googleDriveClientId: "",
  googleDriveSyncEnabled: false,
  googleDriveAutoSync: true,
  githubApiKeyConfigured: false,
  geminiApiKeyConfigured: false,
  azureOpenAiApiKeyConfigured: false,
  telegramBotTokenConfigured: false,
  lineChannelAccessTokenConfigured: false,
  teamsWebhookUrlConfigured: false,
  slackWebhookUrlConfigured: false,
  discordWebhookUrlConfigured: false,
  multiPerspectiveProfiles: DEFAULT_MULTI_PERSPECTIVE_PROFILES,
  customStarters: [],
  hiddenBuiltinStarterIds: [],
  recentGithubFiles: [],
  systemPrompt: [
    "You are an Ollama quick assistant inside the user's browser.",
    "Answer using the current page as context when it is relevant.",
    "If the page context is insufficient, say what is missing.",
    "When you mention a URL or file path, format it as a Markdown link.",
    "For external URLs, use [label](https://example.com). For repo or site-relative file paths, use [path](relative/or/absolute/path).",
    "When helpful, suggest 1 to 3 concrete next-step options for the conversation.",
    "Prefer this format:",
    "If you need, I can help you:",
    "1. ...",
    "2. ...",
    "3. ...",
  ].join("\n"),
};

let secretConfigMigrationPromise = null;

function openLocalDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LOCAL_DB_NAME, LOCAL_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(LOCAL_DB_STORE)) {
        db.createObjectStore(LOCAL_DB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Failed to open IndexedDB."));
  });
}

async function idbGet(key) {
  const db = await openLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LOCAL_DB_STORE, "readonly");
    const store = tx.objectStore(LOCAL_DB_STORE);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Failed to read IndexedDB."));
    tx.oncomplete = () => db.close();
    tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed."));
  });
}

async function idbSet(key, value) {
  const db = await openLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LOCAL_DB_STORE, "readwrite");
    const store = tx.objectStore(LOCAL_DB_STORE);
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error("Failed to write IndexedDB."));
    tx.oncomplete = () => db.close();
    tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed."));
  });
}

async function idbDelete(key) {
  const db = await openLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LOCAL_DB_STORE, "readwrite");
    const store = tx.objectStore(LOCAL_DB_STORE);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error("Failed to delete IndexedDB key."));
    tx.oncomplete = () => db.close();
    tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed."));
  });
}

function sanitizeFileSegment(value, fallback = "chat") {
  const normalized = String(value || "")
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || fallback;
}

function timestampForFile(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}-${hour}${minute}${second}`;
}

function createStableId(prefix = "item") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeMarkdownText(value) {
  return String(value || "").replace(/\r\n/g, "\n").trim();
}

function stripMarkdownForFilename(value) {
  return String(value || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~>-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shortenFileTitle(value, maxLength = 48) {
  const normalized = stripMarkdownForFilename(value)
    .replace(/[<>:"/\\|?*\u0000-\u001F]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return normalized.slice(0, maxLength).replace(/[\s.,;:!?-]+$/g, "").trim();
}

function deriveConversationFileTitle(session = {}) {
  const messages = Array.isArray(session?.messages) ? session.messages : [];
  const firstUserMessage = messages.find((message) => String(message?.role || "").toLowerCase() === "user" && normalizeMarkdownText(message?.content));
  const latestAssistantMessage = [...messages]
    .reverse()
    .find((message) => String(message?.role || "").toLowerCase() === "assistant" && normalizeMarkdownText(message?.content));
  const finalPerspective = normalizeMarkdownText(session?.latestPerspectiveRun?.finalContent);
  const candidates = [
    firstUserMessage?.content,
    finalPerspective,
    latestAssistantMessage?.content,
    session?.pageTitle,
  ];

  for (const candidate of candidates) {
    const title = shortenFileTitle(candidate);
    if (title) {
      return title;
    }
  }

  return "chat";
}

async function openInvestmentProposalBuilderWindow() {
  const url = chrome.runtime.getURL("src/investment-proposal-builder.html");
  try {
    const popup = await chrome.windows.create({
      url,
      type: "popup",
      width: 1180,
      height: 900,
      focused: true,
    });
    return {
      ok: true,
      windowId: popup?.id ?? null,
      mode: "popup",
    };
  } catch (_error) {
    const tab = await chrome.tabs.create({ url, active: true });
    return {
      ok: true,
      tabId: tab?.id ?? null,
      mode: "tab",
    };
  }
}

async function getNextExportSequence() {
  const { [EXPORT_SEQUENCE_KEY]: current } = await chrome.storage.local.get(EXPORT_SEQUENCE_KEY);
  const nextValue = Number.isFinite(Number(current)) ? Number(current) + 1 : 1;
  await chrome.storage.local.set({ [EXPORT_SEQUENCE_KEY]: nextValue });
  return String(nextValue).padStart(4, "0");
}

function buildChatMarkdown(session = {}) {
  const savedAt = session?.savedAt || new Date().toISOString();
  const pageTitle = String(session?.pageTitle || "Untitled conversation").trim();
  const pageUrl = String(session?.pageUrl || "").trim();
  const selectedModel = String(session?.selectedModel || "").trim();
  const replyLanguage = String(session?.replyLanguage || "").trim();
  const includePageContext = session?.includePageContext !== false ? "Enabled" : "Disabled";
  const pageContextMode = session?.pageContextMode === "always" || session?.pageContextMode === "never" || session?.pageContextMode === "auto"
    ? session.pageContextMode
    : session?.includePageContext === false
      ? "never"
      : "auto";
  const messages = Array.isArray(session?.messages) ? session.messages : [];
  const stages = Array.isArray(session?.latestPerspectiveRun?.stages) ? session.latestPerspectiveRun.stages : [];
  const finalPerspective = normalizeMarkdownText(session?.latestPerspectiveRun?.finalContent);

  const lines = [
    `# ${pageTitle}`,
    "",
    `- Saved at: ${savedAt}`,
    `- Page URL: ${pageUrl || "N/A"}`,
    `- Model: ${selectedModel || "N/A"}`,
    `- Reply language: ${replyLanguage || "N/A"}`,
    `- Page context mode: ${pageContextMode}`,
    `- Page context: ${includePageContext}`,
  ];

  if (stages.length || finalPerspective) {
    lines.push("", "## Multi-View Answer");

    stages.forEach((stage, index) => {
      const content = normalizeMarkdownText(stage?.content);
      if (!content) {
        return;
      }
      const label = String(stage?.label || `Stage ${index + 1}`).trim();
      lines.push("", `### ${label}`, "", content);
    });

    if (finalPerspective) {
      lines.push("", "### Final Synthesis", "", finalPerspective);
    }
  }

  lines.push("", "## Conversation");

  if (!messages.length) {
    lines.push("", "_No chat messages saved._");
    return lines.join("\n");
  }

  messages.forEach((message, index) => {
    const role = String(message?.role || "").trim().toLowerCase() === "assistant" ? "Assistant" : "User";
    const content = normalizeMarkdownText(message?.content) || "_Empty message_";
    lines.push("", `### ${index + 1}. ${role}`, "", content);
  });

  return lines.join("\n");
}

async function writeTextFile(handle, filename, contents) {
  const fileHandle = await handle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(contents);
  await writable.close();
}

async function readTextFile(handle, filename) {
  const fileHandle = await handle.getFileHandle(filename);
  const file = await fileHandle.getFile();
  return file.text();
}

async function getWorkFolderHandle() {
  return idbGet(WORK_FOLDER_HANDLE_KEY);
}

function isDirectoryHandleLike(handle) {
  return Boolean(
    handle &&
    (handle.kind === "directory" || typeof handle.kind === "undefined") &&
    typeof handle.getFileHandle === "function" &&
    typeof handle.getDirectoryHandle === "function"
  );
}

function splitRelativePath(path) {
  return String(path || "")
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      if (segment === "." || segment === "..") {
        throw new Error("Invalid local work folder path.");
      }
      return segment;
    });
}

async function resolveDirectoryHandle(rootHandle, path = "") {
  const parts = splitRelativePath(path);
  let currentHandle = rootHandle;
  for (const part of parts) {
    currentHandle = await currentHandle.getDirectoryHandle(part);
  }
  return currentHandle;
}

async function ensureDirectoryHandle(rootHandle, path = "") {
  const parts = splitRelativePath(path);
  let currentHandle = rootHandle;
  for (const part of parts) {
    currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
  }
  return currentHandle;
}

async function ensureWorkFolderSyncDirectories(rootHandle) {
  await ensureDirectoryHandle(rootHandle, WORK_FOLDER_SKILL_DIR);
  await ensureDirectoryHandle(rootHandle, WORK_FOLDER_TASK_DIR);
  await ensureDirectoryHandle(rootHandle, WORK_FOLDER_SYNC_DIR);
  await ensureDirectoryHandle(rootHandle, WORK_FOLDER_DATASET_DIR);
}

function getPathExtension(path) {
  const fileName = String(path || "").split("/").filter(Boolean).pop() || "";
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === fileName.length - 1) {
    return "";
  }
  return fileName.slice(dotIndex + 1).toLowerCase();
}

function isSupportedLocalDocumentPath(path) {
  return SUPPORTED_LOCAL_DOCUMENT_EXTENSIONS.has(getPathExtension(path));
}

async function ensureWorkFolderReadableHandle() {
  const handle = await getWorkFolderHandle();
  if (!handle) {
    throw new Error("Local work folder is not configured.");
  }
  if (!isDirectoryHandleLike(handle)) {
    throw new Error("Local work folder handle is invalid.");
  }
  return handle;
}

async function setWorkFolderHandle(handle) {
  if (isDirectoryHandleLike(handle)) {
    await ensureWorkFolderSyncDirectories(handle);
  }
  await idbSet(WORK_FOLDER_HANDLE_KEY, handle);
  await chrome.storage.local.set({
    [LOCAL_META_KEY]: {
      name: handle?.name || "",
      displayPath: handle?.name ? `/${handle.name}` : "",
      configuredAt: new Date().toISOString(),
    },
  });
}

async function clearWorkFolderHandle() {
  await idbDelete(WORK_FOLDER_HANDLE_KEY);
  await chrome.storage.local.remove(LOCAL_META_KEY);
}

async function getWorkFolderStatus() {
  const { [LOCAL_META_KEY]: meta } = await chrome.storage.local.get(LOCAL_META_KEY);
  const handle = await getWorkFolderHandle();
  let permission = "missing";

  if (isDirectoryHandleLike(handle) && handle?.queryPermission) {
    try {
      permission = await handle.queryPermission({ mode: "readwrite" });
    } catch (_error) {
      permission = "prompt";
    }
  } else if (isDirectoryHandleLike(handle)) {
    permission = "granted";
  }

  return {
    configured: Boolean(handle),
    folderName: meta?.name || handle?.name || "",
    folderPath: meta?.displayPath || (meta?.name ? `/${meta.name}` : handle?.name ? `/${handle.name}` : ""),
    configuredAt: meta?.configuredAt || "",
    permission,
  };
}

async function saveChatSession(session) {
  const payload = {
    ...session,
    savedAt: session?.savedAt || new Date().toISOString(),
  };
  const saveToFolder = session?.saveToFolder === true;
  const requestedFormats = Array.isArray(session?.formats) && session.formats.length ? session.formats : ["md"];

  await chrome.storage.local.set({
    [LATEST_CHAT_SESSION_KEY]: payload,
  });

  if (saveToFolder) {
    await addGoogleDriveDocumentFromSession(payload);
  }

  maybePushWorkFolderSync();
  maybeAutoSyncGoogleDrive();

  if (!saveToFolder) {
    return { savedToFolder: false, reason: "not-requested" };
  }

  const handle = await getWorkFolderHandle();
  if (!handle) {
    return { savedToFolder: false, reason: "not-configured" };
  }
  if (!isDirectoryHandleLike(handle)) {
    return { savedToFolder: false, reason: "invalid-handle", error: "Local work folder handle is invalid." };
  }

  try {
    const sequence = await getNextExportSequence();
    const descriptiveTitle = sanitizeFileSegment(deriveConversationFileTitle(payload), "chat");
    const baseFilename = `${sequence}-${descriptiveTitle}`;
    let jsonFileName = "";
    let markdownFileName = "";

    if (requestedFormats.includes("json")) {
      jsonFileName = `${baseFilename}.json`;
      await writeTextFile(handle, jsonFileName, JSON.stringify(payload, null, 2));
    }
    if (requestedFormats.includes("md")) {
      markdownFileName = `${baseFilename}.md`;
      await writeTextFile(handle, markdownFileName, buildChatMarkdown(payload));
    }

    return {
      savedToFolder: true,
      fileName: markdownFileName || jsonFileName,
      jsonFileName,
      markdownFileName,
      folderName: handle.name || "",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const errorName = error && typeof error === "object" && "name" in error ? String(error.name || "") : "";
    if (errorName === "NotAllowedError" || /permission|denied|not allowed/i.test(message)) {
      return {
        savedToFolder: false,
        reason: "permission-denied",
        error: message,
      };
    }
    if (/getFileHandle is not a function|invalid/i.test(message)) {
      return {
        savedToFolder: false,
        reason: "invalid-handle",
        error: message,
      };
    }
    return {
      savedToFolder: false,
      reason: "write-failed",
      error: message,
    };
  }
}

async function listLocalWorkFolderDirectory(options = {}) {
  try {
    const rootHandle = await ensureWorkFolderReadableHandle();
    const normalizedPath = splitRelativePath(options.path || "").join("/");
    const directoryHandle = await resolveDirectoryHandle(rootHandle, normalizedPath);
    const entries = [];

    for await (const [name, entryHandle] of directoryHandle.entries()) {
      const nextPath = normalizedPath ? `${normalizedPath}/${name}` : name;
      if (entryHandle.kind === "directory") {
        entries.push({ type: "dir", name, path: nextPath });
        continue;
      }

      if (!isSupportedLocalDocumentPath(nextPath)) {
        continue;
      }

      entries.push({ type: "file", name, path: nextPath });
    }

    entries.sort((left, right) => {
      if (left.type !== right.type) {
        return left.type === "dir" ? -1 : 1;
      }
      return left.name.localeCompare(right.name);
    });

    return {
      path: normalizedPath,
      entries,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const errorName = error && typeof error === "object" && "name" in error ? String(error.name || "") : "";
    if (errorName === "NotAllowedError" || /permission|denied|not allowed|invalid/i.test(message)) {
      throw new Error("Local work folder permission is unavailable.");
    }
    throw error;
  }
}

async function readLocalWorkFolderFile(options = {}) {
  try {
    const rootHandle = await ensureWorkFolderReadableHandle();
    const normalizedPath = splitRelativePath(options.path || "").join("/");
    if (!normalizedPath) {
      throw new Error("Local work folder file path is required.");
    }
    if (!isSupportedLocalDocumentPath(normalizedPath)) {
      throw new Error("This local file type is not supported.");
    }

    const parts = splitRelativePath(normalizedPath);
    const fileName = parts.pop();
    const parentHandle = await resolveDirectoryHandle(rootHandle, parts.join("/"));
    const fileHandle = await parentHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();

    return {
      name: file.name,
      path: normalizedPath,
      text: await file.text(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const errorName = error && typeof error === "object" && "name" in error ? String(error.name || "") : "";
    if (errorName === "NotAllowedError" || /permission|denied|not allowed|invalid/i.test(message)) {
      throw new Error("Local work folder permission is unavailable.");
    }
    throw error;
  }
}

async function getLatestChatSession() {
  const { [LATEST_CHAT_SESSION_KEY]: latestChatSession } = await chrome.storage.local.get(LATEST_CHAT_SESSION_KEY);
  return latestChatSession || null;
}

function normalizeTaskText(value, maxLength = 400) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeTaskIsoDate(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  const timestamp = Date.parse(raw);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : "";
}

function createTaskId() {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildTaskAlarmName(taskId) {
  return `${TASK_ALARM_PREFIX}${taskId}`;
}

function getTaskIdFromAlarmName(alarmName) {
  return String(alarmName || "").startsWith(TASK_ALARM_PREFIX) ? String(alarmName).slice(TASK_ALARM_PREFIX.length) : "";
}

function buildTaskNotificationId(taskId) {
  return `${TASK_NOTIFICATION_PREFIX}${taskId}`;
}

function getTaskIdFromNotificationId(notificationId) {
  return String(notificationId || "").startsWith(TASK_NOTIFICATION_PREFIX) ? String(notificationId).slice(TASK_NOTIFICATION_PREFIX.length) : "";
}

function normalizeTaskRecord(task = {}) {
  if (!task || typeof task !== "object") {
    return null;
  }

  const id = normalizeTaskText(task.id || "", 120) || createTaskId();
  const status = String(task.status || "").trim().toLowerCase() === "completed" ? "completed" : "open";
  const dueAt = normalizeTaskIsoDate(task.dueAt || task.due_at_iso || "");
  const reminderAt = normalizeTaskIsoDate(task.reminderAt || task.reminder_at_iso || "");
  const reminderSentAt = normalizeTaskIsoDate(task.reminderSentAt || "");
  const createdAt = normalizeTaskIsoDate(task.createdAt || "") || new Date().toISOString();
  const updatedAt = normalizeTaskIsoDate(task.updatedAt || "") || createdAt;
  const completedAt = status === "completed"
    ? normalizeTaskIsoDate(task.completedAt || "") || updatedAt
    : "";

  return {
    id,
    title: normalizeTaskText(task.title || task.task || "", 180),
    summary: normalizeTaskText(task.summary || task.details || "", 600),
    owner: normalizeTaskText(task.owner || "", 120),
    dueAt,
    dueText: normalizeTaskText(task.dueText || task.due_text || "", 160),
    reminderAt,
    reminderSentAt: reminderAt ? reminderSentAt : "",
    status,
    confidence: normalizeTaskText(task.confidence || "", 40).toLowerCase(),
    evidence: normalizeTaskText(task.evidence || task.sourceMessage || "", 500),
    sourceUrl: normalizeTaskText(task.sourceUrl || "", 1200),
    sourceTitle: normalizeTaskText(task.sourceTitle || "", 240),
    sourceApp: normalizeTaskText(task.sourceApp || "", 120),
    createdAt,
    updatedAt,
    completedAt,
  };
}

function sortTaskRecords(tasks = []) {
  return [...tasks].sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === "open" ? -1 : 1;
    }

    const leftWhen = Date.parse(left.reminderAt || left.dueAt || left.updatedAt || left.createdAt || "") || Number.MAX_SAFE_INTEGER;
    const rightWhen = Date.parse(right.reminderAt || right.dueAt || right.updatedAt || right.createdAt || "") || Number.MAX_SAFE_INTEGER;
    if (leftWhen !== rightWhen) {
      return leftWhen - rightWhen;
    }

    return String(right.updatedAt || "").localeCompare(String(left.updatedAt || ""));
  });
}

async function getTaskRecords() {
  const { [TASKS_STORAGE_KEY]: storedTasks } = await chrome.storage.local.get(TASKS_STORAGE_KEY);
  return sortTaskRecords(
    (Array.isArray(storedTasks) ? storedTasks : [])
      .map((item) => normalizeTaskRecord(item))
      .filter((item) => item?.title)
  );
}

async function saveTaskRecords(tasks) {
  const normalizedTasks = sortTaskRecords(
    (Array.isArray(tasks) ? tasks : [])
      .map((item) => normalizeTaskRecord(item))
      .filter((item) => item?.title)
  );

  await chrome.storage.local.set({
    [TASKS_STORAGE_KEY]: normalizedTasks,
  });

  maybePushWorkFolderSync();
  maybeAutoSyncGoogleDrive();

  return normalizedTasks;
}

async function clearTaskAlarm(taskId) {
  await chrome.alarms.clear(buildTaskAlarmName(taskId));
}

async function scheduleTaskAlarm(task) {
  const normalized = normalizeTaskRecord(task);
  if (!normalized?.id) {
    return false;
  }

  await clearTaskAlarm(normalized.id);

  if (normalized.status === "completed" || !normalized.reminderAt) {
    return false;
  }

  const reminderTimestamp = Date.parse(normalized.reminderAt);
  const sentTimestamp = Date.parse(normalized.reminderSentAt || "");
  if (!Number.isFinite(reminderTimestamp) || (Number.isFinite(sentTimestamp) && sentTimestamp >= reminderTimestamp)) {
    return false;
  }

  chrome.alarms.create(buildTaskAlarmName(normalized.id), {
    when: Math.max(reminderTimestamp, Date.now() + 1000),
  });
  return true;
}

async function restoreTaskAlarms() {
  const tasks = await getTaskRecords();
  for (const task of tasks) {
    await scheduleTaskAlarm(task);
  }
}

function buildTaskNotificationMessage(task) {
  const parts = [];
  if (task.owner) {
    parts.push(`Owner: ${task.owner}`);
  }
  if (task.dueAt) {
    parts.push(`Due: ${new Date(task.dueAt).toLocaleString()}`);
  } else if (task.dueText) {
    parts.push(`Due: ${task.dueText}`);
  }
  if (task.sourceTitle) {
    parts.push(task.sourceTitle);
  } else if (task.sourceApp) {
    parts.push(task.sourceApp);
  }

  return parts.join(" • ").slice(0, 240) || "Time to follow up on this chat task.";
}

async function upsertTaskRecord(taskInput = {}) {
  const normalizedInput = normalizeTaskRecord(taskInput);
  if (!normalizedInput?.title) {
    throw new Error("Task title is required.");
  }

  const tasks = await getTaskRecords();
  const index = tasks.findIndex((item) => item.id === normalizedInput.id);
  const existing = index >= 0 ? tasks[index] : null;
  const nowIso = new Date().toISOString();
  const reminderChanged = !existing || existing.reminderAt !== normalizedInput.reminderAt;
  const merged = normalizeTaskRecord({
    ...existing,
    ...normalizedInput,
    id: existing?.id || normalizedInput.id || createTaskId(),
    createdAt: existing?.createdAt || normalizedInput.createdAt || nowIso,
    updatedAt: nowIso,
    completedAt:
      normalizedInput.status === "completed"
        ? existing?.completedAt || normalizedInput.completedAt || nowIso
        : "",
    reminderSentAt: reminderChanged ? "" : normalizedInput.reminderSentAt || existing?.reminderSentAt || "",
  });

  if (!merged?.title) {
    throw new Error("Task title is required.");
  }

  const nextTasks = [...tasks];
  if (index >= 0) {
    nextTasks[index] = merged;
  } else {
    nextTasks.push(merged);
  }

  const savedTasks = await saveTaskRecords(nextTasks);
  await scheduleTaskAlarm(merged);

  return {
    task: savedTasks.find((item) => item.id === merged.id) || merged,
    tasks: savedTasks,
  };
}

async function deleteTaskRecord(taskId) {
  const normalizedTaskId = normalizeTaskText(taskId || "", 120);
  if (!normalizedTaskId) {
    throw new Error("Task id is required.");
  }

  const tasks = await getTaskRecords();
  const nextTasks = tasks.filter((item) => item.id !== taskId && normalizeTaskText(item.id || "", 120) !== normalizedTaskId);
  await saveTaskRecords(nextTasks);
  await clearTaskAlarm(normalizedTaskId);
  return {
    deletedId: normalizedTaskId,
    deleted: nextTasks.length !== tasks.length,
    tasks: nextTasks,
  };
}

function createWatchtowerId() {
  return `watch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeWatchtowerUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  try {
    const parsed = new URL(raw);
    if (!/^https?:$/i.test(parsed.protocol)) {
      return "";
    }
    parsed.hash = "";
    return parsed.toString();
  } catch (_error) {
    return "";
  }
}

function normalizeWatchtowerInterval(value) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) {
    return WATCHTOWER_DEFAULT_INTERVAL_MINUTES;
  }
  return Math.min(Math.max(parsed, WATCHTOWER_MIN_INTERVAL_MINUTES), WATCHTOWER_MAX_INTERVAL_MINUTES);
}

function normalizeWatchtowerContent(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/\u00a0/g, " ")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[\t ]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .slice(0, WATCHTOWER_MAX_BASELINE_TEXT);
}

function hashWatchtowerContent(value) {
  const normalized = normalizeWatchtowerContent(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function computeWatchtowerDiff(previousValue, currentValue, maxLines = 12) {
  const previousLines = normalizeWatchtowerContent(previousValue).split("\n").filter(Boolean);
  const currentLines = normalizeWatchtowerContent(currentValue).split("\n").filter(Boolean);
  const previousSet = new Set(previousLines);
  const currentSet = new Set(currentLines);
  const addedAll = currentLines.filter((line) => !previousSet.has(line));
  const removedAll = previousLines.filter((line) => !currentSet.has(line));

  return {
    added: addedAll.slice(0, maxLines),
    removed: removedAll.slice(0, maxLines),
    addedCount: addedAll.length,
    removedCount: removedAll.length,
  };
}

function buildWatchtowerFallbackSummary(diff = {}) {
  const parts = [];
  if (Array.isArray(diff.added) && diff.added.length) {
    parts.push(`新增：${diff.added.slice(0, 2).join(" / ")}`);
  }
  if (Array.isArray(diff.removed) && diff.removed.length) {
    parts.push(`移除：${diff.removed.slice(0, 2).join(" / ")}`);
  }
  if (!parts.length) {
    parts.push("頁面內容已變更。");
  }
  return normalizeTaskText(parts.join(" • "), 280);
}

function parseWatchtowerAgentDecision(value) {
  const source = String(value || "").trim();
  if (!source) {
    return null;
  }
  const cleaned = source
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) {
    return null;
  }

  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    if (typeof parsed?.relevant !== "boolean") {
      return null;
    }
    return {
      relevant: parsed.relevant,
      summary: normalizeTaskText(parsed.summary || "", 280),
    };
  } catch (_error) {
    return null;
  }
}

function normalizeWatchtowerMonitor(monitor = {}) {
  if (!monitor || typeof monitor !== "object") {
    return null;
  }
  const url = normalizeWatchtowerUrl(monitor.url || "");
  if (!url) {
    return null;
  }
  const createdAt = normalizeTaskIsoDate(monitor.createdAt || "") || new Date().toISOString();
  const updatedAt = normalizeTaskIsoDate(monitor.updatedAt || "") || createdAt;
  const allowedStatuses = new Set(["pending", "baseline", "unchanged", "changed", "ignored", "error"]);
  const checkStatus = String(monitor.lastCheckStatus || "pending").trim().toLowerCase();

  return {
    id: normalizeTaskText(monitor.id || "", 120) || createWatchtowerId(),
    url,
    title: normalizeTaskText(monitor.title || url, 240),
    condition: normalizeTaskText(monitor.condition || "", 800),
    intervalMinutes: normalizeWatchtowerInterval(monitor.intervalMinutes),
    enabled: monitor.enabled !== false,
    contentHash: normalizeTaskText(monitor.contentHash || "", 80),
    baselineText: normalizeWatchtowerContent(monitor.baselineText || ""),
    createdAt,
    updatedAt,
    lastCheckedAt: normalizeTaskIsoDate(monitor.lastCheckedAt || ""),
    lastChangedAt: normalizeTaskIsoDate(monitor.lastChangedAt || ""),
    lastCheckStatus: allowedStatuses.has(checkStatus) ? checkStatus : "pending",
    lastDecision: normalizeTaskText(monitor.lastDecision || "", 40),
    lastSummary: normalizeTaskText(monitor.lastSummary || "", 280),
    lastError: normalizeTaskText(monitor.lastError || "", 500),
    changeCount: Math.max(0, Number.parseInt(String(monitor.changeCount || 0), 10) || 0),
  };
}

function getPublicWatchtowerMonitor(monitor) {
  const normalized = normalizeWatchtowerMonitor(monitor);
  if (!normalized) {
    return null;
  }
  const { baselineText: _baselineText, contentHash: _contentHash, ...publicMonitor } = normalized;
  return publicMonitor;
}

function normalizeWatchtowerEvent(event = {}) {
  if (!event || typeof event !== "object") {
    return null;
  }
  const monitorId = normalizeTaskText(event.monitorId || "", 120);
  const url = normalizeWatchtowerUrl(event.url || "");
  if (!monitorId || !url) {
    return null;
  }
  return {
    id: normalizeTaskText(event.id || "", 120) || `watch-event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    monitorId,
    url,
    title: normalizeTaskText(event.title || url, 240),
    condition: normalizeTaskText(event.condition || "", 800),
    detectedAt: normalizeTaskIsoDate(event.detectedAt || "") || new Date().toISOString(),
    relevant: event.relevant !== false,
    summary: normalizeTaskText(event.summary || "", 280),
    addedCount: Math.max(0, Number.parseInt(String(event.addedCount || 0), 10) || 0),
    removedCount: Math.max(0, Number.parseInt(String(event.removedCount || 0), 10) || 0),
    evaluationError: normalizeTaskText(event.evaluationError || "", 500),
  };
}

async function getWatchtowerMonitors() {
  const { [WATCHTOWER_MONITORS_STORAGE_KEY]: stored } = await chrome.storage.local.get(WATCHTOWER_MONITORS_STORAGE_KEY);
  return (Array.isArray(stored) ? stored : [])
    .map((item) => normalizeWatchtowerMonitor(item))
    .filter(Boolean)
    .sort((left, right) => String(right.updatedAt || "").localeCompare(String(left.updatedAt || "")))
    .slice(0, WATCHTOWER_MAX_MONITORS);
}

async function saveWatchtowerMonitors(monitors = []) {
  const normalized = (Array.isArray(monitors) ? monitors : [])
    .map((item) => normalizeWatchtowerMonitor(item))
    .filter(Boolean)
    .sort((left, right) => String(right.updatedAt || "").localeCompare(String(left.updatedAt || "")))
    .slice(0, WATCHTOWER_MAX_MONITORS);
  await chrome.storage.local.set({ [WATCHTOWER_MONITORS_STORAGE_KEY]: normalized });
  return normalized;
}

async function getWatchtowerEvents() {
  const { [WATCHTOWER_EVENTS_STORAGE_KEY]: stored } = await chrome.storage.local.get(WATCHTOWER_EVENTS_STORAGE_KEY);
  return (Array.isArray(stored) ? stored : [])
    .map((item) => normalizeWatchtowerEvent(item))
    .filter(Boolean)
    .sort((left, right) => String(right.detectedAt || "").localeCompare(String(left.detectedAt || "")))
    .slice(0, WATCHTOWER_MAX_EVENTS);
}

async function prependWatchtowerEvent(event) {
  const normalized = normalizeWatchtowerEvent(event);
  if (!normalized) {
    return getWatchtowerEvents();
  }
  const events = await getWatchtowerEvents();
  const next = [normalized, ...events.filter((item) => item.id !== normalized.id)].slice(0, WATCHTOWER_MAX_EVENTS);
  await chrome.storage.local.set({ [WATCHTOWER_EVENTS_STORAGE_KEY]: next });
  return next;
}

function buildWatchtowerAlarmName(monitorId) {
  return `${WATCHTOWER_ALARM_PREFIX}${monitorId}`;
}

function getWatchtowerIdFromAlarmName(alarmName) {
  return String(alarmName || "").startsWith(WATCHTOWER_ALARM_PREFIX)
    ? String(alarmName).slice(WATCHTOWER_ALARM_PREFIX.length)
    : "";
}

function buildWatchtowerNotificationId(monitorId) {
  return `${WATCHTOWER_NOTIFICATION_PREFIX}${monitorId}`;
}

function getWatchtowerIdFromNotificationId(notificationId) {
  return String(notificationId || "").startsWith(WATCHTOWER_NOTIFICATION_PREFIX)
    ? String(notificationId).slice(WATCHTOWER_NOTIFICATION_PREFIX.length)
    : "";
}

async function clearWatchtowerAlarm(monitorId) {
  await chrome.alarms.clear(buildWatchtowerAlarmName(monitorId));
}

async function scheduleWatchtowerAlarm(monitor) {
  const normalized = normalizeWatchtowerMonitor(monitor);
  if (!normalized) {
    return false;
  }
  await clearWatchtowerAlarm(normalized.id);
  if (!normalized.enabled) {
    return false;
  }
  chrome.alarms.create(buildWatchtowerAlarmName(normalized.id), {
    delayInMinutes: normalized.intervalMinutes,
    periodInMinutes: normalized.intervalMinutes,
  });
  return true;
}

async function restoreWatchtowerAlarms() {
  const monitors = await getWatchtowerMonitors();
  for (const monitor of monitors) {
    await scheduleWatchtowerAlarm(monitor);
  }
}

function buildWatchtowerSnapshotText(context = {}) {
  return normalizeWatchtowerContent([
    context.title ? `Title: ${context.title}` : "",
    context.metaDescription ? `Description: ${context.metaDescription}` : "",
    context.headings ? `Headings: ${context.headings}` : "",
    context.pageText || "",
  ].filter(Boolean).join("\n"));
}

async function getWatchtowerPageContext(monitor) {
  const targetUrl = normalizeWatchtowerUrl(monitor?.url || "");
  const tabs = await chrome.tabs.query({});
  const matchingTab = tabs.find((tab) => Number.isFinite(Number(tab?.id)) && normalizeWatchtowerUrl(tab?.url || "") === targetUrl);
  if (matchingTab?.id) {
    try {
      const response = await chrome.tabs.sendMessage(Number(matchingTab.id), {
        type: "edge-ai-chat:get-page-context",
        expandDetails: true,
      });
      if (response?.ok && response.context) {
        return response.context;
      }
    } catch (_error) {
      // Fall back to loading the URL in a temporary background tab.
    }
  }
  return getPageContextFromUrl(targetUrl);
}

function buildWatchtowerAgentPrompt(monitor, diff) {
  return [
    "You are Watchtower, a webpage change monitoring agent.",
    "Judge whether the detected change matches the user's observation condition.",
    "Return one JSON object only: {\"relevant\": boolean, \"summary\": string}.",
    "The summary must be concise, factual, and in the same language as the observation condition.",
    `Page: ${monitor.title}`,
    `URL: ${monitor.url}`,
    `Observation condition: ${monitor.condition}`,
    `Added lines (${diff.addedCount}):\n${diff.added.map((line) => `+ ${line}`).join("\n") || "(none)"}`,
    `Removed lines (${diff.removedCount}):\n${diff.removed.map((line) => `- ${line}`).join("\n") || "(none)"}`,
  ].join("\n\n");
}

async function evaluateWatchtowerChange(monitor, diff) {
  const fallbackSummary = buildWatchtowerFallbackSummary(diff);
  if (!monitor.condition) {
    return { relevant: true, summary: fallbackSummary, evaluationError: "" };
  }

  try {
    const result = await generateWithConfiguredProvider(buildWatchtowerAgentPrompt(monitor, diff));
    const decision = parseWatchtowerAgentDecision(result?.response || "");
    if (!decision) {
      throw new Error("The provider did not return a valid Watchtower decision.");
    }
    return {
      relevant: decision.relevant,
      summary: decision.summary || fallbackSummary,
      evaluationError: "",
    };
  } catch (error) {
    return {
      relevant: true,
      summary: fallbackSummary,
      evaluationError: error instanceof Error ? error.message : String(error),
    };
  }
}

async function updateWatchtowerMonitorRecord(monitorId, patch = {}) {
  const monitors = await getWatchtowerMonitors();
  const index = monitors.findIndex((item) => item.id === monitorId);
  if (index < 0) {
    return { monitor: null, monitors };
  }
  const updated = normalizeWatchtowerMonitor({ ...monitors[index], ...patch, updatedAt: new Date().toISOString() });
  monitors[index] = updated;
  const saved = await saveWatchtowerMonitors(monitors);
  return {
    monitor: saved.find((item) => item.id === monitorId) || updated,
    monitors: saved,
  };
}

async function runWatchtowerCheck(monitorId, options = {}) {
  const normalizedId = normalizeTaskText(monitorId || "", 120);
  if (!normalizedId) {
    throw new Error("Watchtower monitor id is required.");
  }
  if (watchtowerRunLocks.has(normalizedId)) {
    const monitors = await getWatchtowerMonitors();
    return { monitor: getPublicWatchtowerMonitor(monitors.find((item) => item.id === normalizedId)), skipped: true, reason: "already-running" };
  }

  watchtowerRunLocks.add(normalizedId);
  try {
    const monitors = await getWatchtowerMonitors();
    const monitor = monitors.find((item) => item.id === normalizedId);
    if (!monitor) {
      throw new Error("Watchtower monitor was not found.");
    }
    if (!monitor.enabled && options.force !== true) {
      return { monitor: getPublicWatchtowerMonitor(monitor), skipped: true, reason: "paused" };
    }

    const context = await getWatchtowerPageContext(monitor);
    const snapshotText = buildWatchtowerSnapshotText(context);
    if (!snapshotText) {
      throw new Error("Watchtower could not extract readable page content.");
    }
    const nowIso = new Date().toISOString();
    const contentHash = hashWatchtowerContent(snapshotText);

    if (!monitor.contentHash || !monitor.baselineText) {
      const updated = await updateWatchtowerMonitorRecord(normalizedId, {
        title: context?.title || monitor.title,
        contentHash,
        baselineText: snapshotText,
        lastCheckedAt: nowIso,
        lastCheckStatus: "baseline",
        lastDecision: "baseline",
        lastSummary: "Baseline captured.",
        lastError: "",
      });
      return { monitor: getPublicWatchtowerMonitor(updated.monitor), changed: false, baselineCreated: true };
    }

    if (monitor.contentHash === contentHash) {
      const updated = await updateWatchtowerMonitorRecord(normalizedId, {
        lastCheckedAt: nowIso,
        lastCheckStatus: "unchanged",
        lastDecision: "unchanged",
        lastError: "",
      });
      return { monitor: getPublicWatchtowerMonitor(updated.monitor), changed: false };
    }

    const diff = computeWatchtowerDiff(monitor.baselineText, snapshotText);
    const decision = await evaluateWatchtowerChange(monitor, diff);
    const status = decision.relevant ? "changed" : "ignored";
    const event = normalizeWatchtowerEvent({
      monitorId: monitor.id,
      url: monitor.url,
      title: context?.title || monitor.title,
      condition: monitor.condition,
      detectedAt: nowIso,
      relevant: decision.relevant,
      summary: decision.summary,
      addedCount: diff.addedCount,
      removedCount: diff.removedCount,
      evaluationError: decision.evaluationError,
    });
    await prependWatchtowerEvent(event);
    const updated = await updateWatchtowerMonitorRecord(normalizedId, {
      title: context?.title || monitor.title,
      contentHash,
      baselineText: snapshotText,
      lastCheckedAt: nowIso,
      lastChangedAt: nowIso,
      lastCheckStatus: status,
      lastDecision: decision.relevant ? "relevant" : "ignored",
      lastSummary: decision.summary,
      lastError: decision.evaluationError,
      changeCount: monitor.changeCount + 1,
    });

    if (decision.relevant) {
      await chrome.notifications.create(buildWatchtowerNotificationId(normalizedId), {
        type: "basic",
        iconUrl: "assets/icons/icon-128.png",
        title: `Watchtower · ${normalizeTaskText(context?.title || monitor.title, 120)}`,
        message: normalizeTaskText(decision.summary || "Relevant webpage change detected.", 280),
        priority: 1,
      });
    }

    return {
      monitor: getPublicWatchtowerMonitor(updated.monitor),
      event,
      changed: true,
      relevant: decision.relevant,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const updated = await updateWatchtowerMonitorRecord(normalizedId, {
      lastCheckedAt: new Date().toISOString(),
      lastCheckStatus: "error",
      lastDecision: "error",
      lastError: message,
    });
    return { monitor: getPublicWatchtowerMonitor(updated.monitor), changed: false, error: message };
  } finally {
    watchtowerRunLocks.delete(normalizedId);
  }
}

async function upsertWatchtowerMonitor(input = {}) {
  const url = normalizeWatchtowerUrl(input.url || "");
  if (!url) {
    throw new Error("A valid http(s) URL is required.");
  }
  const monitors = await getWatchtowerMonitors();
  const requestedId = normalizeTaskText(input.id || "", 120);
  const index = monitors.findIndex((item) => item.id === requestedId || item.url === url);
  if (index < 0 && monitors.length >= WATCHTOWER_MAX_MONITORS) {
    throw new Error(`Watchtower supports up to ${WATCHTOWER_MAX_MONITORS} monitors.`);
  }
  const existing = index >= 0 ? monitors[index] : null;
  const nowIso = new Date().toISOString();
  const merged = normalizeWatchtowerMonitor({
    ...existing,
    ...input,
    id: existing?.id || requestedId || createWatchtowerId(),
    url,
    title: input.title || existing?.title || url,
    enabled: input.enabled !== false,
    createdAt: existing?.createdAt || nowIso,
    updatedAt: nowIso,
  });
  if (index >= 0) {
    monitors[index] = merged;
  } else {
    monitors.push(merged);
  }
  await saveWatchtowerMonitors(monitors);
  await scheduleWatchtowerAlarm(merged);
  const check = await runWatchtowerCheck(merged.id, { force: true });
  return {
    monitor: check.monitor || getPublicWatchtowerMonitor(merged),
    monitors: (await getWatchtowerMonitors()).map(getPublicWatchtowerMonitor).filter(Boolean),
    events: await getWatchtowerEvents(),
    check,
  };
}

async function setWatchtowerMonitorEnabled(monitorId, enabled) {
  const updated = await updateWatchtowerMonitorRecord(normalizeTaskText(monitorId || "", 120), { enabled: enabled === true });
  if (!updated.monitor) {
    throw new Error("Watchtower monitor was not found.");
  }
  await scheduleWatchtowerAlarm(updated.monitor);
  return {
    monitor: getPublicWatchtowerMonitor(updated.monitor),
    monitors: updated.monitors.map(getPublicWatchtowerMonitor).filter(Boolean),
    events: await getWatchtowerEvents(),
  };
}

async function deleteWatchtowerMonitor(monitorId) {
  const normalizedId = normalizeTaskText(monitorId || "", 120);
  if (!normalizedId) {
    throw new Error("Watchtower monitor id is required.");
  }
  const monitors = await getWatchtowerMonitors();
  const nextMonitors = monitors.filter((item) => item.id !== normalizedId);
  const events = (await getWatchtowerEvents()).filter((item) => item.monitorId !== normalizedId);
  await saveWatchtowerMonitors(nextMonitors);
  await chrome.storage.local.set({ [WATCHTOWER_EVENTS_STORAGE_KEY]: events });
  await clearWatchtowerAlarm(normalizedId);
  await chrome.notifications.clear(buildWatchtowerNotificationId(normalizedId)).catch(() => {});
  return {
    deleted: nextMonitors.length !== monitors.length,
    deletedId: normalizedId,
    monitors: nextMonitors.map(getPublicWatchtowerMonitor).filter(Boolean),
    events,
  };
}

async function getWatchtowerState() {
  return {
    monitors: (await getWatchtowerMonitors()).map(getPublicWatchtowerMonitor).filter(Boolean),
    events: await getWatchtowerEvents(),
  };
}

function normalizeSecretValue(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function pickSecretConfig(source = {}) {
  return SECRET_CONFIG_FIELDS.reduce((result, field) => {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      result[field] = normalizeSecretValue(source[field]);
    }
    return result;
  }, {});
}

function omitSecretConfig(source = {}) {
  const next = { ...source };
  SECRET_CONFIG_FIELDS.forEach((field) => {
    delete next[field];
  });
  return next;
}

function buildSecretAccessFlags(secretConfig = {}) {
  return {
    githubApiKeyConfigured: Boolean(normalizeSecretValue(secretConfig.githubApiKey)),
    geminiApiKeyConfigured: Boolean(normalizeSecretValue(secretConfig.geminiApiKey)),
    azureOpenAiApiKeyConfigured: Boolean(normalizeSecretValue(secretConfig.azureOpenAiApiKey)),
    telegramBotTokenConfigured: Boolean(normalizeSecretValue(secretConfig.telegramBotToken)),
    lineChannelAccessTokenConfigured: Boolean(normalizeSecretValue(secretConfig.lineChannelAccessToken)),
    teamsWebhookUrlConfigured: Boolean(normalizeSecretValue(secretConfig.teamsWebhookUrl)),
    slackWebhookUrlConfigured: Boolean(normalizeSecretValue(secretConfig.slackWebhookUrl)),
    discordWebhookUrlConfigured: Boolean(normalizeSecretValue(secretConfig.discordWebhookUrl)),
  };
}

function buildTelegramFlowNotificationMessage(payload = {}) {
  const flowName = String(payload.flowName || "Unnamed Agent Flow").trim() || "Unnamed Agent Flow";
  const model = String(payload.model || "").trim();
  const pageTitle = String(payload.pageTitle || "").trim();
  const pageUrl = String(payload.pageUrl || "").trim();
  const finalOutput = normalizeMarkdownText(payload.finalOutput || "");
  const finishedAt = String(payload.finishedAt || new Date().toISOString()).trim();
  const lines = [
    "Open Copilot flow complete",
    "",
    `Flow: ${flowName}`,
  ];

  if (model) {
    lines.push(`Model: ${model}`);
  }
  if (pageTitle) {
    lines.push(`Page: ${pageTitle}`);
  }
  if (pageUrl) {
    lines.push(`URL: ${pageUrl}`);
  }
  lines.push(`Finished: ${finishedAt}`);

  if (finalOutput) {
    const preview = finalOutput.length > 1200 ? `${finalOutput.slice(0, 1200).trim()}...` : finalOutput;
    lines.push("", "Final output preview:", preview);
  }

  return lines.join("\n");
}

function buildTelegramTaskReminderMessage(task = {}) {
  const title = String(task.title || "Untitled task").trim() || "Untitled task";
  const summary = normalizeTaskText(task.summary || "", 1000);
  const owner = String(task.owner || "").trim();
  const reminderAt = normalizeTaskIsoDate(task.reminderAt || "");
  const dueAt = normalizeTaskIsoDate(task.dueAt || "");
  const dueText = String(task.dueText || "").trim();
  const sourceTitle = String(task.sourceTitle || "").trim();
  const sourceUrl = String(task.sourceUrl || "").trim();
  const lines = [
    "Open Copilot task reminder",
    "",
    `Task: ${title}`,
  ];

  if (owner) {
    lines.push(`Owner: ${owner}`);
  }
  if (reminderAt) {
    lines.push(`Reminder: ${reminderAt}`);
  }
  if (dueAt) {
    lines.push(`Due: ${dueAt}`);
  } else if (dueText) {
    lines.push(`Due: ${dueText}`);
  }
  if (sourceTitle) {
    lines.push(`Source: ${sourceTitle}`);
  }
  if (sourceUrl) {
    lines.push(`URL: ${sourceUrl}`);
  }
  if (summary) {
    lines.push("", "Summary:", summary);
  }

  return lines.join("\n");
}

async function sendTelegramMessage({ botToken, chatId, text }) {
  const normalizedBotToken = normalizeSecretValue(botToken);
  const normalizedChatId = normalizeSecretValue(chatId);
  const normalizedText = String(text || "").trim();

  if (!normalizedBotToken) {
    throw new Error("Telegram bot token is not configured.");
  }
  if (!normalizedChatId) {
    throw new Error("Telegram chat ID is not configured.");
  }
  if (!normalizedText) {
    throw new Error("Telegram notification text is empty.");
  }

  const response = await fetch(`https://api.telegram.org/bot${normalizedBotToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: normalizedChatId,
      text: normalizedText,
      disable_web_page_preview: true,
    }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.description || `Telegram request failed with status ${response.status}.`);
  }

  return payload;
}

function buildLineFlowNotificationText(payload = {}) {
  const flowName = String(payload.flowName || "Unnamed Agent Flow").trim() || "Unnamed Agent Flow";
  const model = String(payload.model || "").trim();
  const pageTitle = String(payload.pageTitle || "").trim();
  const pageUrl = String(payload.pageUrl || "").trim();
  const finalOutput = normalizeMarkdownText(payload.finalOutput || "");
  const finishedAt = String(payload.finishedAt || new Date().toISOString()).trim();
  const lines = [
    "Open Copilot flow complete",
    `Flow: ${flowName}`,
  ];
  if (model) {
    lines.push(`Model: ${model}`);
  }
  if (pageTitle) {
    lines.push(`Page: ${pageTitle}`);
  }
  if (pageUrl) {
    lines.push(`URL: ${pageUrl}`);
  }
  lines.push(`Finished: ${finishedAt}`);
  if (finalOutput) {
    const preview = finalOutput.length > 1200 ? `${finalOutput.slice(0, 1200).trim()}...` : finalOutput;
    lines.push("", "Final output preview:", preview);
  }
  return lines.join("\n");
}

function buildLineTaskReminderText(task = {}) {
  const title = String(task.title || "Untitled task").trim() || "Untitled task";
  const summary = normalizeTaskText(task.summary || "", 1000);
  const owner = String(task.owner || "").trim();
  const reminderAt = normalizeTaskIsoDate(task.reminderAt || "");
  const dueAt = normalizeTaskIsoDate(task.dueAt || "");
  const dueText = String(task.dueText || "").trim();
  const sourceTitle = String(task.sourceTitle || "").trim();
  const sourceUrl = String(task.sourceUrl || "").trim();
  const lines = [
    "Open Copilot task reminder",
    `Task: ${title}`,
  ];
  if (owner) {
    lines.push(`Owner: ${owner}`);
  }
  if (reminderAt) {
    lines.push(`Reminder: ${reminderAt}`);
  }
  if (dueAt) {
    lines.push(`Due: ${dueAt}`);
  } else if (dueText) {
    lines.push(`Due: ${dueText}`);
  }
  if (sourceTitle) {
    lines.push(`Source: ${sourceTitle}`);
  }
  if (sourceUrl) {
    lines.push(`URL: ${sourceUrl}`);
  }
  if (summary) {
    lines.push("", "Summary:", summary);
  }
  return lines.join("\n");
}

async function sendLineMessage({ channelAccessToken, to, text }) {
  const normalizedToken = normalizeSecretValue(channelAccessToken);
  const normalizedTo = normalizeSecretValue(to);
  const normalizedText = String(text || "").trim();

  if (!normalizedToken) {
    throw new Error("LINE channel access token is not configured.");
  }
  if (!normalizedTo) {
    throw new Error("LINE target ID is not configured.");
  }
  if (!normalizedText) {
    throw new Error("LINE notification text is empty.");
  }

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${normalizedToken}`,
    },
    body: JSON.stringify({
      to: normalizedTo,
      messages: [
        {
          type: "text",
          text: normalizedText.slice(0, 5000),
        },
      ],
    }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (!response.ok) {
    const details = payload?.message || payload?.details?.[0]?.message || `LINE request failed with status ${response.status}.`;
    throw new Error(details);
  }

  return payload;
}

function buildTeamsAdaptiveMessage({ title, textLines = [], summary, facts = [], accentColor = "2EB886", metadata = {} }) {
  const body = [];
  const normalizedTitle = String(title || "Open Copilot notification").trim();
  if (normalizedTitle) {
    body.push({
      type: "TextBlock",
      size: "Large",
      weight: "Bolder",
      text: normalizedTitle,
      wrap: true,
      color: "Accent",
    });
  }
  if (Array.isArray(facts) && facts.length) {
    body.push({
      type: "FactSet",
      facts: facts
        .filter((item) => String(item?.title || "").trim() && String(item?.value || "").trim())
        .map((item) => ({
          title: String(item.title).trim(),
          value: String(item.value).trim(),
        })),
    });
  }
  (Array.isArray(textLines) ? textLines : []).forEach((line) => {
    const normalized = String(line || "").trim();
    if (!normalized) {
      return;
    }
    body.push({
      type: "TextBlock",
      text: normalized,
      wrap: true,
    });
  });

  return {
    type: "message",
    source: "Open Copilot",
    app: "Open Copilot",
    eventType: String(metadata.eventType || "").trim(),
    eventLabel: String(metadata.eventLabel || "").trim(),
    sentAt: String(metadata.sentAt || new Date().toISOString()).trim(),
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          msTeams: {
            width: "Full",
          },
          body,
        },
      },
    ],
    summary: String(summary || normalizedTitle || "Open Copilot notification").trim(),
    themeColor: accentColor,
  };
}

async function sendTeamsWebhookMessage({ webhookUrl, card }) {
  const normalizedWebhookUrl = normalizeSecretValue(webhookUrl);
  if (!normalizedWebhookUrl) {
    throw new Error("Teams webhook URL is not configured.");
  }
  if (!/^https:\/\/.+/i.test(normalizedWebhookUrl)) {
    throw new Error("Teams webhook URL must start with https://");
  }

  const response = await fetch(normalizedWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(card || {}),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Teams webhook request failed with status ${response.status}.`);
  }

  return text;
}

function buildSlackWebhookPayload({ title, textLines = [], fields = [], accentColor = "#4A8CFF" }) {
  const normalizedTitle = String(title || "Open Copilot notification").trim();
  const normalizedFields = (Array.isArray(fields) ? fields : [])
    .filter((item) => String(item?.title || "").trim() && String(item?.value || "").trim())
    .map((item) => ({
      type: "mrkdwn",
      text: `*${String(item.title).trim()}*\n${String(item.value).trim()}`,
    }));
  const normalizedLines = (Array.isArray(textLines) ? textLines : [])
    .map((line) => String(line || "").trim())
    .filter(Boolean);
  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: normalizedTitle,
      },
    },
  ];

  if (normalizedFields.length) {
    blocks.push({
      type: "section",
      fields: normalizedFields,
    });
  }
  if (normalizedLines.length) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: normalizedLines.join("\n"),
      },
    });
  }

  return {
    text: [normalizedTitle, ...normalizedLines].join("\n").trim(),
    attachments: [
      {
        color: accentColor,
        blocks,
      },
    ],
  };
}

async function sendSlackWebhookMessage({ webhookUrl, payload }) {
  const normalizedWebhookUrl = normalizeSecretValue(webhookUrl);
  if (!normalizedWebhookUrl) {
    throw new Error("Slack webhook URL is not configured.");
  }
  if (!/^https:\/\/hooks\.slack\.com\/services\/.+/i.test(normalizedWebhookUrl)) {
    throw new Error("Slack webhook URL must start with https://hooks.slack.com/services/");
  }

  const response = await fetch(normalizedWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload || {}),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Slack webhook request failed with status ${response.status}.`);
  }

  return text;
}

function buildDiscordWebhookPayload({ title, descriptionLines = [], fields = [], color = 0x4a8cff }) {
  const normalizedTitle = String(title || "Open Copilot notification").trim();
  const normalizedDescription = (Array.isArray(descriptionLines) ? descriptionLines : [])
    .map((line) => String(line || "").trim())
    .filter(Boolean)
    .join("\n");
  const normalizedFields = (Array.isArray(fields) ? fields : [])
    .filter((item) => String(item?.title || "").trim() && String(item?.value || "").trim())
    .map((item) => ({
      name: String(item.title).trim(),
      value: String(item.value).trim().slice(0, 1024),
      inline: true,
    }));

  return {
    content: normalizedTitle,
    embeds: [
      {
        title: normalizedTitle,
        description: normalizedDescription.slice(0, 4096),
        color,
        fields: normalizedFields.slice(0, 25),
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

async function sendDiscordWebhookMessage({ webhookUrl, payload }) {
  const normalizedWebhookUrl = normalizeSecretValue(webhookUrl);
  if (!normalizedWebhookUrl) {
    throw new Error("Discord webhook URL is not configured.");
  }
  if (!/^https:\/\/(?:canary\.|ptb\.)?discord\.com\/api\/webhooks\/.+/i.test(normalizedWebhookUrl)) {
    throw new Error("Discord webhook URL must start with https://discord.com/api/webhooks/");
  }

  const response = await fetch(normalizedWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload || {}),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Discord webhook request failed with status ${response.status}.`);
  }

  return text;
}

function buildTeamsFlowNotificationCard(payload = {}) {
  const flowName = String(payload.flowName || "Unnamed Agent Flow").trim() || "Unnamed Agent Flow";
  const model = String(payload.model || "").trim();
  const pageTitle = String(payload.pageTitle || "").trim();
  const pageUrl = String(payload.pageUrl || "").trim();
  const finalOutput = normalizeMarkdownText(payload.finalOutput || "");
  const finishedAt = String(payload.finishedAt || new Date().toISOString()).trim();
  const lines = [];
  if (finalOutput) {
    const preview = finalOutput.length > 1200 ? `${finalOutput.slice(0, 1200).trim()}...` : finalOutput;
    lines.push("Final output preview", preview);
  }
  return buildTeamsAdaptiveMessage({
    title: "Open Copilot flow complete",
    summary: `Flow complete: ${flowName}`,
    facts: [
      { title: "Flow", value: flowName },
      { title: "Model", value: model },
      { title: "Page", value: pageTitle },
      { title: "URL", value: pageUrl },
      { title: "Finished", value: finishedAt },
    ],
    textLines: lines,
    accentColor: "2EB886",
    metadata: {
      eventType: "agent_flow_complete",
      eventLabel: flowName,
      sentAt: finishedAt,
    },
  });
}

function buildTeamsTaskReminderCard(task = {}) {
  const title = String(task.title || "Untitled task").trim() || "Untitled task";
  const summary = normalizeTaskText(task.summary || "", 1000);
  const owner = String(task.owner || "").trim();
  const reminderAt = normalizeTaskIsoDate(task.reminderAt || "");
  const dueAt = normalizeTaskIsoDate(task.dueAt || "");
  const dueText = String(task.dueText || "").trim();
  const sourceTitle = String(task.sourceTitle || "").trim();
  const sourceUrl = String(task.sourceUrl || "").trim();
  const lines = [];
  if (summary) {
    lines.push("Summary", summary);
  }
  return buildTeamsAdaptiveMessage({
    title: "Open Copilot task reminder",
    summary: `Task reminder: ${title}`,
    facts: [
      { title: "Task", value: title },
      { title: "Owner", value: owner },
      { title: "Reminder", value: reminderAt },
      { title: "Due", value: dueAt || dueText },
      { title: "Source", value: sourceTitle },
      { title: "URL", value: sourceUrl },
    ],
    textLines: lines,
    accentColor: "E8A23A",
    metadata: {
      eventType: "task_reminder",
      eventLabel: title,
      sentAt: reminderAt || dueAt || new Date().toISOString(),
    },
  });
}

function buildSlackFlowNotificationPayload(payload = {}) {
  const flowName = String(payload.flowName || "Unnamed Agent Flow").trim() || "Unnamed Agent Flow";
  const model = String(payload.model || "").trim();
  const pageTitle = String(payload.pageTitle || "").trim();
  const pageUrl = String(payload.pageUrl || "").trim();
  const finalOutput = normalizeMarkdownText(payload.finalOutput || "");
  const finishedAt = String(payload.finishedAt || new Date().toISOString()).trim();
  const textLines = [];
  if (finalOutput) {
    const preview = finalOutput.length > 1200 ? `${finalOutput.slice(0, 1200).trim()}...` : finalOutput;
    textLines.push(`*Final output preview*\n${preview}`);
  }
  return buildSlackWebhookPayload({
    title: "Open Copilot flow complete",
    fields: [
      { title: "Flow", value: flowName },
      { title: "Model", value: model },
      { title: "Page", value: pageTitle },
      { title: "URL", value: pageUrl },
      { title: "Finished", value: finishedAt },
    ],
    textLines,
    accentColor: "#4A8CFF",
  });
}

function buildSlackTaskReminderPayload(task = {}) {
  const title = String(task.title || "Untitled task").trim() || "Untitled task";
  const summary = normalizeTaskText(task.summary || "", 1000);
  const owner = String(task.owner || "").trim();
  const reminderAt = normalizeTaskIsoDate(task.reminderAt || "");
  const dueAt = normalizeTaskIsoDate(task.dueAt || "");
  const dueText = String(task.dueText || "").trim();
  const sourceTitle = String(task.sourceTitle || "").trim();
  const sourceUrl = String(task.sourceUrl || "").trim();
  const textLines = summary ? [`*Summary*\n${summary}`] : [];
  return buildSlackWebhookPayload({
    title: "Open Copilot task reminder",
    fields: [
      { title: "Task", value: title },
      { title: "Owner", value: owner },
      { title: "Reminder", value: reminderAt },
      { title: "Due", value: dueAt || dueText },
      { title: "Source", value: sourceTitle },
      { title: "URL", value: sourceUrl },
    ],
    textLines,
    accentColor: "#E8A23A",
  });
}

function buildDiscordFlowNotificationPayload(payload = {}) {
  const flowName = String(payload.flowName || "Unnamed Agent Flow").trim() || "Unnamed Agent Flow";
  const model = String(payload.model || "").trim();
  const pageTitle = String(payload.pageTitle || "").trim();
  const pageUrl = String(payload.pageUrl || "").trim();
  const finalOutput = normalizeMarkdownText(payload.finalOutput || "");
  const finishedAt = String(payload.finishedAt || new Date().toISOString()).trim();
  const descriptionLines = [];
  if (finalOutput) {
    const preview = finalOutput.length > 1200 ? `${finalOutput.slice(0, 1200).trim()}...` : finalOutput;
    descriptionLines.push(`**Final output preview**\n${preview}`);
  }
  return buildDiscordWebhookPayload({
    title: "Open Copilot flow complete",
    fields: [
      { title: "Flow", value: flowName },
      { title: "Model", value: model },
      { title: "Page", value: pageTitle },
      { title: "URL", value: pageUrl },
      { title: "Finished", value: finishedAt },
    ],
    descriptionLines,
    color: 0x4a8cff,
  });
}

function buildDiscordTaskReminderPayload(task = {}) {
  const title = String(task.title || "Untitled task").trim() || "Untitled task";
  const summary = normalizeTaskText(task.summary || "", 1000);
  const owner = String(task.owner || "").trim();
  const reminderAt = normalizeTaskIsoDate(task.reminderAt || "");
  const dueAt = normalizeTaskIsoDate(task.dueAt || "");
  const dueText = String(task.dueText || "").trim();
  const sourceTitle = String(task.sourceTitle || "").trim();
  const sourceUrl = String(task.sourceUrl || "").trim();
  const descriptionLines = summary ? [`**Summary**\n${summary}`] : [];
  return buildDiscordWebhookPayload({
    title: "Open Copilot task reminder",
    fields: [
      { title: "Task", value: title },
      { title: "Owner", value: owner },
      { title: "Reminder", value: reminderAt },
      { title: "Due", value: dueAt || dueText },
      { title: "Source", value: sourceTitle },
      { title: "URL", value: sourceUrl },
    ],
    descriptionLines,
    color: 0xE8A23A,
  });
}

function buildBatchUrlQaNotificationTextLines(payload = {}) {
  const fileName = String(payload.fileName || "batch-url-qa.jsonl").trim() || "batch-url-qa.jsonl";
  const outputPath = String(payload.outputPath || "").trim();
  const model = String(payload.model || "").trim();
  const outputLanguage = String(payload.outputLanguage || "").trim();
  const total = Number.isFinite(Number(payload.total)) ? Number(payload.total) : 0;
  const successCount = Number.isFinite(Number(payload.successCount)) ? Number(payload.successCount) : 0;
  const failureCount = Number.isFinite(Number(payload.failureCount)) ? Number(payload.failureCount) : 0;
  const finishedAt = String(payload.finishedAt || new Date().toISOString()).trim();
  return [
    `File: ${fileName}`,
    outputPath ? `Output: ${outputPath}` : "",
    model ? `Model: ${model}` : "",
    outputLanguage ? `Language: ${outputLanguage}` : "",
    `URLs: ${total}`,
    `Success: ${successCount}`,
    `Failed: ${failureCount}`,
    `Finished: ${finishedAt}`,
  ].filter(Boolean);
}

function buildTelegramBatchUrlQaNotificationMessage(payload = {}) {
  return [
    "Open Copilot Batch URL QA complete",
    "",
    ...buildBatchUrlQaNotificationTextLines(payload),
  ].join("\n");
}

function buildLineBatchUrlQaNotificationText(payload = {}) {
  return [
    "Open Copilot Batch URL QA complete",
    "",
    ...buildBatchUrlQaNotificationTextLines(payload),
  ].join("\n");
}

function buildTeamsBatchUrlQaNotificationCard(payload = {}) {
  return buildTeamsAdaptiveMessage({
    title: "Open Copilot Batch URL QA complete",
    summary: "Batch URL QA complete",
    textLines: buildBatchUrlQaNotificationTextLines(payload),
    accentColor: "4DA3FF",
    metadata: {
      eventType: "batch_url_qa_complete",
      eventLabel: String(payload.fileName || "batch-url-qa.jsonl"),
      sentAt: String(payload.finishedAt || new Date().toISOString()),
      source: "Open Copilot",
    },
  });
}

function buildSlackBatchUrlQaNotificationPayload(payload = {}) {
  return buildSlackWebhookPayload({
    title: "Open Copilot Batch URL QA complete",
    textLines: buildBatchUrlQaNotificationTextLines(payload),
    accentColor: "#4A8CFF",
  });
}

function buildDiscordBatchUrlQaNotificationPayload(payload = {}) {
  return buildDiscordWebhookPayload({
    title: "Open Copilot Batch URL QA complete",
    fields: buildBatchUrlQaNotificationTextLines(payload).map((line) => {
      const separatorIndex = line.indexOf(":");
      return separatorIndex > 0
        ? { title: line.slice(0, separatorIndex), value: line.slice(separatorIndex + 1).trim() }
        : { title: "Detail", value: line };
    }),
    color: 0x4a8cff,
  });
}

async function notifyBatchUrlQaCompletion(payload = {}) {
  const config = await getConfig();
  const tasks = [];

  if (config.telegramNotificationEnabled && normalizeSecretValue(config.telegramBotToken) && normalizeSecretValue(config.telegramChatId)) {
    tasks.push(sendTelegramMessage({
      botToken: config.telegramBotToken,
      chatId: config.telegramChatId,
      text: buildTelegramBatchUrlQaNotificationMessage(payload),
    }).catch(() => null));
  }
  if (config.lineNotificationEnabled && normalizeSecretValue(config.lineChannelAccessToken) && normalizeSecretValue(config.lineTo)) {
    tasks.push(sendLineMessage({
      channelAccessToken: config.lineChannelAccessToken,
      to: config.lineTo,
      text: buildLineBatchUrlQaNotificationText(payload),
    }).catch(() => null));
  }
  if (config.teamsNotificationEnabled && normalizeSecretValue(config.teamsWebhookUrl)) {
    tasks.push(sendTeamsWebhookMessage({
      webhookUrl: config.teamsWebhookUrl,
      card: buildTeamsBatchUrlQaNotificationCard(payload),
    }).catch(() => null));
  }
  if (config.slackNotificationEnabled && normalizeSecretValue(config.slackWebhookUrl)) {
    tasks.push(sendSlackWebhookMessage({
      webhookUrl: config.slackWebhookUrl,
      payload: buildSlackBatchUrlQaNotificationPayload(payload),
    }).catch(() => null));
  }
  if (config.discordNotificationEnabled && normalizeSecretValue(config.discordWebhookUrl)) {
    tasks.push(sendDiscordWebhookMessage({
      webhookUrl: config.discordWebhookUrl,
      payload: buildDiscordBatchUrlQaNotificationPayload(payload),
    }).catch(() => null));
  }

  if (!tasks.length) {
    return { skipped: true, reason: "disabled" };
  }

  await Promise.all(tasks);
  return { skipped: false };
}

async function notifyTelegramAgentFlowComplete(payload = {}) {
  const config = await getConfig();
  if (!config.telegramNotificationEnabled) {
    return { skipped: true, reason: "disabled" };
  }

  if (!normalizeSecretValue(config.telegramBotToken)) {
    return { skipped: true, reason: "missing-bot-token" };
  }

  if (!normalizeSecretValue(config.telegramChatId)) {
    return { skipped: true, reason: "missing-chat-id" };
  }

  const text = buildTelegramFlowNotificationMessage(payload);
  const result = await sendTelegramMessage({
    botToken: config.telegramBotToken,
    chatId: config.telegramChatId,
    text,
  });

  return {
    skipped: false,
    result,
  };
}

async function notifyTelegramTaskReminder(task = {}) {
  const config = await getConfig();
  if (!config.telegramNotificationEnabled) {
    return { skipped: true, reason: "disabled" };
  }

  if (!normalizeSecretValue(config.telegramBotToken)) {
    return { skipped: true, reason: "missing-bot-token" };
  }

  if (!normalizeSecretValue(config.telegramChatId)) {
    return { skipped: true, reason: "missing-chat-id" };
  }

  const text = buildTelegramTaskReminderMessage(task);
  const result = await sendTelegramMessage({
    botToken: config.telegramBotToken,
    chatId: config.telegramChatId,
    text,
  });

  return {
    skipped: false,
    result,
  };
}

async function testTelegramNotification() {
  const config = await getConfig();
  const text = [
    "Open Copilot Telegram test",
    "",
    "This is a test message from Settings.",
    `Sent: ${new Date().toISOString()}`,
  ].join("\n");

  const result = await sendTelegramMessage({
    botToken: config.telegramBotToken,
    chatId: config.telegramChatId,
    text,
  });

  return {
    ok: true,
    result,
  };
}

async function notifyLineAgentFlowComplete(payload = {}) {
  const config = await getConfig();
  if (!config.lineNotificationEnabled) {
    return { skipped: true, reason: "disabled" };
  }
  if (!normalizeSecretValue(config.lineChannelAccessToken)) {
    return { skipped: true, reason: "missing-channel-access-token" };
  }
  if (!normalizeSecretValue(config.lineTo)) {
    return { skipped: true, reason: "missing-to" };
  }
  const result = await sendLineMessage({
    channelAccessToken: config.lineChannelAccessToken,
    to: config.lineTo,
    text: buildLineFlowNotificationText(payload),
  });
  return { skipped: false, result };
}

async function notifyLineTaskReminder(task = {}) {
  const config = await getConfig();
  if (!config.lineNotificationEnabled) {
    return { skipped: true, reason: "disabled" };
  }
  if (!normalizeSecretValue(config.lineChannelAccessToken)) {
    return { skipped: true, reason: "missing-channel-access-token" };
  }
  if (!normalizeSecretValue(config.lineTo)) {
    return { skipped: true, reason: "missing-to" };
  }
  const result = await sendLineMessage({
    channelAccessToken: config.lineChannelAccessToken,
    to: config.lineTo,
    text: buildLineTaskReminderText(task),
  });
  return { skipped: false, result };
}

async function testLineNotification() {
  const config = await getConfig();
  const result = await sendLineMessage({
    channelAccessToken: config.lineChannelAccessToken,
    to: config.lineTo,
    text: [
      "Open Copilot LINE test",
      "",
      "This is a test message from Settings.",
      `Sent: ${new Date().toISOString()}`,
    ].join("\n"),
  });
  return {
    ok: true,
    result,
  };
}

async function notifyTeamsAgentFlowComplete(payload = {}) {
  const config = await getConfig();
  if (!config.teamsNotificationEnabled) {
    return { skipped: true, reason: "disabled" };
  }
  if (!normalizeSecretValue(config.teamsWebhookUrl)) {
    return { skipped: true, reason: "missing-webhook-url" };
  }
  const result = await sendTeamsWebhookMessage({
    webhookUrl: config.teamsWebhookUrl,
    card: buildTeamsFlowNotificationCard(payload),
  });
  return { skipped: false, result };
}

async function notifyTeamsTaskReminder(task = {}) {
  const config = await getConfig();
  if (!config.teamsNotificationEnabled) {
    return { skipped: true, reason: "disabled" };
  }
  if (!normalizeSecretValue(config.teamsWebhookUrl)) {
    return { skipped: true, reason: "missing-webhook-url" };
  }
  const result = await sendTeamsWebhookMessage({
    webhookUrl: config.teamsWebhookUrl,
    card: buildTeamsTaskReminderCard(task),
  });
  return { skipped: false, result };
}

async function testTeamsNotification() {
  const config = await getConfig();
  const result = await sendTeamsWebhookMessage({
    webhookUrl: config.teamsWebhookUrl,
    card: buildTeamsAdaptiveMessage({
      title: "Open Copilot Teams test",
      summary: "Teams test message",
      textLines: [
        "This is a test message from Settings.",
        `Sent: ${new Date().toISOString()}`,
      ],
      accentColor: "4DA3FF",
      metadata: {
        eventType: "test",
        eventLabel: "Teams test",
        sentAt: new Date().toISOString(),
      },
    }),
  });
  return {
    ok: true,
    result,
  };
}

async function notifySlackAgentFlowComplete(payload = {}) {
  const config = await getConfig();
  if (!config.slackNotificationEnabled) {
    return { skipped: true, reason: "disabled" };
  }
  if (!normalizeSecretValue(config.slackWebhookUrl)) {
    return { skipped: true, reason: "missing-webhook-url" };
  }
  const result = await sendSlackWebhookMessage({
    webhookUrl: config.slackWebhookUrl,
    payload: buildSlackFlowNotificationPayload(payload),
  });
  return { skipped: false, result };
}

async function notifySlackTaskReminder(task = {}) {
  const config = await getConfig();
  if (!config.slackNotificationEnabled) {
    return { skipped: true, reason: "disabled" };
  }
  if (!normalizeSecretValue(config.slackWebhookUrl)) {
    return { skipped: true, reason: "missing-webhook-url" };
  }
  const result = await sendSlackWebhookMessage({
    webhookUrl: config.slackWebhookUrl,
    payload: buildSlackTaskReminderPayload(task),
  });
  return { skipped: false, result };
}

async function testSlackNotification() {
  const config = await getConfig();
  const result = await sendSlackWebhookMessage({
    webhookUrl: config.slackWebhookUrl,
    payload: buildSlackWebhookPayload({
      title: "Open Copilot Slack test",
      textLines: [
        "This is a test message from Settings.",
        `Sent: ${new Date().toISOString()}`,
      ],
      accentColor: "#4A8CFF",
    }),
  });
  return {
    ok: true,
    result,
  };
}

async function notifyDiscordAgentFlowComplete(payload = {}) {
  const config = await getConfig();
  if (!config.discordNotificationEnabled) {
    return { skipped: true, reason: "disabled" };
  }
  if (!normalizeSecretValue(config.discordWebhookUrl)) {
    return { skipped: true, reason: "missing-webhook-url" };
  }
  const result = await sendDiscordWebhookMessage({
    webhookUrl: config.discordWebhookUrl,
    payload: buildDiscordFlowNotificationPayload(payload),
  });
  return { skipped: false, result };
}

async function notifyDiscordTaskReminder(task = {}) {
  const config = await getConfig();
  if (!config.discordNotificationEnabled) {
    return { skipped: true, reason: "disabled" };
  }
  if (!normalizeSecretValue(config.discordWebhookUrl)) {
    return { skipped: true, reason: "missing-webhook-url" };
  }
  const result = await sendDiscordWebhookMessage({
    webhookUrl: config.discordWebhookUrl,
    payload: buildDiscordTaskReminderPayload(task),
  });
  return { skipped: false, result };
}

async function testDiscordNotification() {
  const config = await getConfig();
  const result = await sendDiscordWebhookMessage({
    webhookUrl: config.discordWebhookUrl,
    payload: buildDiscordWebhookPayload({
      title: "Open Copilot Discord test",
      descriptionLines: [
        "This is a test message from Settings.",
        `Sent: ${new Date().toISOString()}`,
      ],
      color: 0x4a8cff,
    }),
  });
  return {
    ok: true,
    result,
  };
}

async function getSecretConfig() {
  const { [LOCAL_SECRET_CONFIG_KEY]: storedSecretConfig } = await chrome.storage.local.get(LOCAL_SECRET_CONFIG_KEY);
  return {
    ...DEFAULT_SECRET_CONFIG,
    ...(storedSecretConfig && typeof storedSecretConfig === "object" ? storedSecretConfig : {}),
  };
}

async function setSecretConfig(secretConfig = {}) {
  const normalized = {
    ...DEFAULT_SECRET_CONFIG,
    ...pickSecretConfig(secretConfig),
  };
  await chrome.storage.local.set({
    [LOCAL_SECRET_CONFIG_KEY]: normalized,
  });
  return normalized;
}

async function ensureSecretConfigMigrated() {
  if (secretConfigMigrationPromise) {
    return secretConfigMigrationPromise;
  }

  secretConfigMigrationPromise = (async () => {
    const legacySyncSecrets = await chrome.storage.sync.get(SECRET_CONFIG_FIELDS);
    const legacySecretPatch = pickSecretConfig(legacySyncSecrets);
    const hasLegacySecrets = Object.keys(legacySecretPatch).length > 0;

    if (!hasLegacySecrets) {
      return;
    }

    const localSecretConfig = await getSecretConfig();
    const nextSecretConfig = {
      ...localSecretConfig,
    };

    SECRET_CONFIG_FIELDS.forEach((field) => {
      const legacyValue = normalizeSecretValue(legacySecretPatch[field]);
      if (!legacyValue) {
        return;
      }
      if (!normalizeSecretValue(nextSecretConfig[field])) {
        nextSecretConfig[field] = legacyValue;
      }
    });

    await chrome.storage.local.set({
      [LOCAL_SECRET_CONFIG_KEY]: nextSecretConfig,
    });
    await chrome.storage.sync.remove(SECRET_CONFIG_FIELDS);
    await chrome.storage.sync.set(buildSecretAccessFlags(nextSecretConfig));
  })();

  try {
    await secretConfigMigrationPromise;
  } finally {
    secretConfigMigrationPromise = null;
  }
}

function buildConfig(syncConfig = {}, secretConfig = {}, includeSecrets = true) {
  const mergedSync = { ...DEFAULT_CONFIG, ...omitSecretConfig(syncConfig) };
  const mergedSecrets = { ...DEFAULT_SECRET_CONFIG, ...pickSecretConfig(secretConfig) };
  const accessFlags = buildSecretAccessFlags(mergedSecrets);
  const normalized = {
    ...mergedSync,
    ...accessFlags,
  };

  if (includeSecrets) {
    return {
      ...normalized,
      ...mergedSecrets,
    };
  }

  return normalized;
}

function getExtensionOrigin() {
  return new URL(chrome.runtime.getURL("/")).origin;
}

function senderCanAccessSensitiveConfig(sender) {
  const senderUrl = String(sender?.url || "").trim();
  if (!senderUrl) {
    return false;
  }

  try {
    return new URL(senderUrl).origin === getExtensionOrigin();
  } catch (_error) {
    return false;
  }
}

function sanitizeConfigForSender(config, sender) {
  if (senderCanAccessSensitiveConfig(sender)) {
    return { ...config };
  }

  const sanitized = { ...config };
  CLIENT_REDACTED_CONFIG_FIELDS.forEach((field) => {
    delete sanitized[field];
  });
  return sanitized;
}

async function getConfig(options = {}) {
  const includeSecrets = options?.includeSecrets !== false;
  await ensureSecretConfigMigrated();
  const [syncConfig, secretConfig] = await Promise.all([
    chrome.storage.sync.get(DEFAULT_CONFIG),
    getSecretConfig(),
  ]);
  const merged = buildConfig(syncConfig, secretConfig, includeSecrets);
  return {
    ...merged,
    taskExtractionWindowDays: normalizeTaskExtractionWindowDays(merged.taskExtractionWindowDays),
  };
}

async function setConfig(nextConfig) {
  await ensureSecretConfigMigrated();
  const current = await getConfig();
  const currentSecrets = pickSecretConfig(current);
  const nextSecretPatch = pickSecretConfig(nextConfig);
  const mergedSecrets = {
    ...currentSecrets,
    ...nextSecretPatch,
  };
  const merged = {
    ...current,
    ...omitSecretConfig(nextConfig),
    taskExtractionWindowDays: normalizeTaskExtractionWindowDays(nextConfig?.taskExtractionWindowDays ?? current.taskExtractionWindowDays),
    ...buildSecretAccessFlags(mergedSecrets),
  };
  await chrome.storage.sync.set(omitSecretConfig(merged));
  if (Object.keys(nextSecretPatch).length) {
    await setSecretConfig(mergedSecrets);
  }
  maybePushWorkFolderSync();
  maybeAutoSyncGoogleDrive();
  return {
    ...merged,
    ...mergedSecrets,
  };
}

function normalizeTaskExtractionWindowDays(value) {
  const parsed = Number.parseInt(String(value ?? DEFAULT_TASK_EXTRACTION_WINDOW_DAYS), 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_TASK_EXTRACTION_WINDOW_DAYS;
  }
  return Math.min(Math.max(parsed, 1), MAX_TASK_EXTRACTION_WINDOW_DAYS);
}

function sanitizeGoogleDriveClientId(value) {
  return String(value || "").trim();
}

function getGoogleDriveRedirectUrl() {
  if (!chrome.identity?.getRedirectURL) {
    throw new Error("Chrome identity API is not available.");
  }
  return chrome.identity.getRedirectURL("google-drive-sync");
}

async function getGoogleDriveSyncMeta() {
  const { [GOOGLE_DRIVE_SYNC_META_KEY]: meta } = await chrome.storage.local.get(GOOGLE_DRIVE_SYNC_META_KEY);
  return meta && typeof meta === "object" ? meta : {};
}

async function setGoogleDriveSyncMeta(patch = {}) {
  const current = await getGoogleDriveSyncMeta();
  const next = {
    ...current,
    ...patch,
  };
  await chrome.storage.local.set({ [GOOGLE_DRIVE_SYNC_META_KEY]: next });
  return next;
}

async function clearGoogleDriveSyncAuth() {
  const meta = await getGoogleDriveSyncMeta();
  if (meta.accessToken && chrome.identity?.removeCachedAuthToken) {
    try {
      await chrome.identity.removeCachedAuthToken({ token: meta.accessToken });
    } catch (_error) {
      // Token cache cleanup is best effort.
    }
  }
  await chrome.storage.local.set({
    [GOOGLE_DRIVE_SYNC_META_KEY]: {
      fileId: meta.fileId || "",
      lastSyncAt: meta.lastSyncAt || "",
      lastError: "",
      tokenExpiresAt: 0,
      accessToken: "",
    },
  });
}

function parseOAuthFragment(url) {
  const parsed = new URL(String(url || ""));
  const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  const error = fragment.get("error");
  if (error) {
    throw new Error(`Google authorization failed: ${error}`);
  }
  const accessToken = fragment.get("access_token") || "";
  if (!accessToken) {
    throw new Error("Google authorization did not return an access token.");
  }
  const expiresIn = Number.parseInt(fragment.get("expires_in") || "3600", 10);
  return {
    accessToken,
    tokenExpiresAt: Date.now() + Math.max(Number.isFinite(expiresIn) ? expiresIn : 3600, 60) * 1000,
  };
}

async function authorizeGoogleDrive(interactive = false) {
  const config = await getConfig();
  const clientId = sanitizeGoogleDriveClientId(config.googleDriveClientId);
  if (!clientId) {
    throw new Error("Google Drive OAuth Client ID is required.");
  }

  const meta = await getGoogleDriveSyncMeta();
  if (!interactive && meta.accessToken && Number(meta.tokenExpiresAt || 0) > Date.now() + 60000) {
    return meta.accessToken;
  }

  if (!chrome.identity?.launchWebAuthFlow) {
    throw new Error("Chrome identity API is not available.");
  }

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "token");
  authUrl.searchParams.set("redirect_uri", getGoogleDriveRedirectUrl());
  authUrl.searchParams.set("scope", GOOGLE_DRIVE_SYNC_SCOPE);
  authUrl.searchParams.set("prompt", interactive ? "consent" : "none");

  const redirectUrl = await chrome.identity.launchWebAuthFlow({
    url: authUrl.toString(),
    interactive,
  });
  const token = parseOAuthFragment(redirectUrl);
  await setGoogleDriveSyncMeta({
    ...token,
    lastError: "",
  });
  return token.accessToken;
}

async function getGoogleDriveAuthHeader(interactive = false) {
  return {
    Authorization: `Bearer ${await authorizeGoogleDrive(interactive)}`,
  };
}

async function googleDriveFetch(url, init = {}, interactive = false) {
  const headers = {
    ...(init.headers || {}),
    ...(await getGoogleDriveAuthHeader(interactive)),
  };
  const response = await fetch(url, { ...init, headers });
  if (response.status === 401) {
    await clearGoogleDriveSyncAuth();
    const retryHeaders = {
      ...(init.headers || {}),
      ...(await getGoogleDriveAuthHeader(interactive)),
    };
    return fetch(url, { ...init, headers: retryHeaders });
  }
  return response;
}

async function readGoogleDriveJsonResponse(response) {
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Google Drive HTTP ${response.status}: ${text || response.statusText}`);
  }
  return text ? JSON.parse(text) : null;
}

async function findGoogleDriveSyncFile(interactive = false) {
  const meta = await getGoogleDriveSyncMeta();
  if (meta.fileId) {
    return meta.fileId;
  }

  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("spaces", "appDataFolder");
  url.searchParams.set("fields", "files(id,name,modifiedTime)");
  url.searchParams.set("q", `name='${GOOGLE_DRIVE_SYNC_FILE_NAME.replaceAll("'", "\\'")}' and 'appDataFolder' in parents and trashed=false`);

  const response = await googleDriveFetch(url.toString(), { method: "GET" }, interactive);
  const payload = await readGoogleDriveJsonResponse(response);
  const fileId = Array.isArray(payload?.files) && payload.files[0]?.id ? payload.files[0].id : "";
  if (fileId) {
    await setGoogleDriveSyncMeta({ fileId });
  }
  return fileId;
}

function buildMultipartBody(metadata, content) {
  const boundary = `edge-ai-chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(content, null, 2),
    `--${boundary}--`,
    "",
  ].join("\r\n");
  return {
    body,
    contentType: `multipart/related; boundary=${boundary}`,
  };
}

async function uploadGoogleDriveSyncPayload(payload, interactive = false) {
  const existingFileId = await findGoogleDriveSyncFile(interactive);
  const metadata = existingFileId
    ? { name: GOOGLE_DRIVE_SYNC_FILE_NAME, mimeType: "application/json" }
    : { name: GOOGLE_DRIVE_SYNC_FILE_NAME, mimeType: "application/json", parents: ["appDataFolder"] };
  const multipart = buildMultipartBody(metadata, payload);
  const url = existingFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(existingFileId)}?uploadType=multipart&fields=id,name,modifiedTime`
    : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime";
  const response = await googleDriveFetch(
    url,
    {
      method: existingFileId ? "PATCH" : "POST",
      headers: {
        "Content-Type": multipart.contentType,
      },
      body: multipart.body,
    },
    interactive
  );
  const result = await readGoogleDriveJsonResponse(response);
  await setGoogleDriveSyncMeta({
    fileId: result?.id || existingFileId || "",
    lastSyncAt: new Date().toISOString(),
    lastError: "",
  });
  return result;
}

async function downloadGoogleDriveSyncPayload(interactive = false) {
  const fileId = await findGoogleDriveSyncFile(interactive);
  if (!fileId) {
    return null;
  }
  const response = await googleDriveFetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    { method: "GET" },
    interactive
  );
  return readGoogleDriveJsonResponse(response);
}

async function getGoogleDriveDocuments() {
  const { [GOOGLE_DRIVE_SYNC_DOCUMENTS_KEY]: documents } = await chrome.storage.local.get(GOOGLE_DRIVE_SYNC_DOCUMENTS_KEY);
  return Array.isArray(documents) ? documents : [];
}

async function saveGoogleDriveDocuments(documents) {
  const normalized = (Array.isArray(documents) ? documents : [])
    .filter((item) => item && typeof item === "object")
    .sort((left, right) => String(right.savedAt || "").localeCompare(String(left.savedAt || "")))
    .slice(0, MAX_GOOGLE_DRIVE_SYNC_DOCUMENTS);
  await chrome.storage.local.set({ [GOOGLE_DRIVE_SYNC_DOCUMENTS_KEY]: normalized });
  return normalized;
}

async function addGoogleDriveDocumentFromSession(session = {}) {
  const savedAt = session?.savedAt || new Date().toISOString();
  const fileName = `${timestampForFile(new Date(savedAt))}-${sanitizeFileSegment(deriveConversationFileTitle(session), "chat")}.md`;
  const document = {
    id: createStableId("doc"),
    fileName,
    savedAt,
    pageTitle: String(session?.pageTitle || "Untitled conversation"),
    pageUrl: String(session?.pageUrl || ""),
    markdown: buildChatMarkdown(session),
    session,
  };
  const documents = await getGoogleDriveDocuments();
  await saveGoogleDriveDocuments([document, ...documents]);
  return document;
}

async function buildGoogleDriveSyncPayload() {
  const config = await getConfig();
  const latestChatSession = await getLatestChatSession();
  return {
    version: GOOGLE_DRIVE_SYNC_VERSION,
    updatedAt: new Date().toISOString(),
    customStarters: Array.isArray(config.customStarters) ? config.customStarters : [],
    tasks: await getTaskRecords(),
    latestChatSession,
    documents: await getGoogleDriveDocuments(),
  };
}

function mergeById(localItems, remoteItems, getTimestamp) {
  const merged = new Map();
  for (const item of [...(Array.isArray(localItems) ? localItems : []), ...(Array.isArray(remoteItems) ? remoteItems : [])]) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const id = String(item.id || "").trim();
    if (!id) {
      continue;
    }
    const existing = merged.get(id);
    const itemTime = Date.parse(getTimestamp(item) || "") || 0;
    const existingTime = Date.parse(getTimestamp(existing) || "") || 0;
    if (!existing || itemTime >= existingTime) {
      merged.set(id, item);
    }
  }
  return Array.from(merged.values());
}

function chooseLatestByTime(localItem, remoteItem, field) {
  const localTime = Date.parse(localItem?.[field] || "") || 0;
  const remoteTime = Date.parse(remoteItem?.[field] || "") || 0;
  return remoteTime > localTime ? remoteItem : localItem;
}

async function applyGoogleDriveSyncPayload(remotePayload = {}) {
  const config = await getConfig();
  const mergedStarters = mergeById(config.customStarters, remotePayload.customStarters, (item) => item.updatedAt || item.id);
  await chrome.storage.sync.set({
    ...config,
    customStarters: mergedStarters,
  });

  const mergedTasks = sortTaskRecords(mergeById(await getTaskRecords(), remotePayload.tasks, (item) => item.updatedAt || item.createdAt));
  await chrome.storage.local.set({ [TASKS_STORAGE_KEY]: mergedTasks });
  await restoreTaskAlarms();

  const localLatestSession = await getLatestChatSession();
  const nextLatestSession = chooseLatestByTime(localLatestSession, remotePayload.latestChatSession, "savedAt");
  if (nextLatestSession) {
    await chrome.storage.local.set({ [LATEST_CHAT_SESSION_KEY]: nextLatestSession });
  }

  const mergedDocuments = mergeById(await getGoogleDriveDocuments(), remotePayload.documents, (item) => item.savedAt);
  await saveGoogleDriveDocuments(mergedDocuments);

  return buildGoogleDriveSyncPayload();
}

async function getWritableWorkFolderHandle() {
  const handle = await getWorkFolderHandle();
  if (!handle) {
    throw new Error("Local work folder is not configured.");
  }
  if (!isDirectoryHandleLike(handle)) {
    throw new Error("Local work folder handle is invalid.");
  }
  await ensureWorkFolderSyncDirectories(handle);
  return handle;
}

async function writeWorkFolderJson(path, fileName, data) {
  const rootHandle = await getWritableWorkFolderHandle();
  const directoryHandle = await ensureDirectoryHandle(rootHandle, path);
  await writeTextFile(directoryHandle, fileName, JSON.stringify(data, null, 2));
}

async function writeWorkFolderText(path, fileName, contents) {
  const rootHandle = await getWritableWorkFolderHandle();
  const directoryHandle = await ensureDirectoryHandle(rootHandle, path);
  await writeTextFile(directoryHandle, fileName, String(contents || ""));
}

async function readWorkFolderJson(path, fileName) {
  const rootHandle = await getWritableWorkFolderHandle();
  const directoryHandle = await resolveDirectoryHandle(rootHandle, path);
  return JSON.parse(await readTextFile(directoryHandle, fileName));
}

async function writeNamedWorkFolderJson(options = {}) {
  const path = String(options.path || "").trim();
  const fileName = String(options.fileName || "").trim();
  if (!fileName) {
    throw new Error("Local work folder file name is required.");
  }
  await writeWorkFolderJson(path, fileName, options.data ?? {});
  return {
    path,
    fileName,
  };
}

async function readNamedWorkFolderJson(options = {}) {
  const path = String(options.path || "").trim();
  const fileName = String(options.fileName || "").trim();
  if (!fileName) {
    throw new Error("Local work folder file name is required.");
  }
  return {
    path,
    fileName,
    data: await readWorkFolderJson(path, fileName),
  };
}

function createTransferSessionId(prefix = "wf") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function beginWorkFolderJsonWriteSession(options = {}) {
  const path = String(options.path || "").trim();
  const fileName = String(options.fileName || "").trim();
  if (!fileName) {
    throw new Error("Local work folder file name is required.");
  }
  const rootHandle = await getWritableWorkFolderHandle();
  const directoryHandle = await ensureDirectoryHandle(rootHandle, path);
  const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  const sessionId = createTransferSessionId("wf-write");
  workFolderTransferSessions.set(sessionId, {
    type: "write-json",
    writable,
    path,
    fileName,
    bytesWritten: 0,
  });
  return {
    sessionId,
    path,
    fileName,
  };
}

async function appendWorkFolderJsonWriteSession(options = {}) {
  const sessionId = String(options.sessionId || "").trim();
  const chunk = String(options.chunk || "");
  const session = workFolderTransferSessions.get(sessionId);
  if (!session || session.type !== "write-json") {
    throw new Error("Work folder write session not found.");
  }
  await session.writable.write(chunk);
  session.bytesWritten += chunk.length;
  return {
    sessionId,
    bytesWritten: session.bytesWritten,
  };
}

async function finishWorkFolderJsonWriteSession(options = {}) {
  const sessionId = String(options.sessionId || "").trim();
  const session = workFolderTransferSessions.get(sessionId);
  if (!session || session.type !== "write-json") {
    throw new Error("Work folder write session not found.");
  }
  await session.writable.close();
  workFolderTransferSessions.delete(sessionId);
  return {
    sessionId,
    path: session.path,
    fileName: session.fileName,
    bytesWritten: session.bytesWritten,
  };
}

async function beginWorkFolderJsonReadSession(options = {}) {
  const path = String(options.path || "").trim();
  const fileName = String(options.fileName || "").trim();
  if (!fileName) {
    throw new Error("Local work folder file name is required.");
  }
  const data = await readWorkFolderJson(path, fileName);
  const text = JSON.stringify(data);
  const sessionId = createTransferSessionId("wf-read");
  workFolderTransferSessions.set(sessionId, {
    type: "read-json",
    text,
    path,
    fileName,
    size: text.length,
  });
  return {
    sessionId,
    path,
    fileName,
    size: text.length,
  };
}

async function readWorkFolderJsonReadSessionChunk(options = {}) {
  const sessionId = String(options.sessionId || "").trim();
  const offset = Math.max(0, Number.parseInt(String(options.offset || 0), 10) || 0);
  const length = Math.max(1, Number.parseInt(String(options.length || 0), 10) || 1);
  const session = workFolderTransferSessions.get(sessionId);
  if (!session || session.type !== "read-json") {
    throw new Error("Work folder read session not found.");
  }
  const chunk = session.text.slice(offset, offset + length);
  return {
    sessionId,
    offset,
    length: chunk.length,
    done: offset + chunk.length >= session.size,
    chunk,
  };
}

async function finishWorkFolderJsonReadSession(options = {}) {
  const sessionId = String(options.sessionId || "").trim();
  const session = workFolderTransferSessions.get(sessionId);
  if (!session || session.type !== "read-json") {
    throw new Error("Work folder read session not found.");
  }
  workFolderTransferSessions.delete(sessionId);
  return {
    sessionId,
    path: session.path,
    fileName: session.fileName,
    size: session.size,
  };
}

async function writeWorkFolderStarters(starters) {
  await writeWorkFolderJson(WORK_FOLDER_SKILL_DIR, WORK_FOLDER_STARTERS_FILE, {
    version: GOOGLE_DRIVE_SYNC_VERSION,
    updatedAt: new Date().toISOString(),
    customStarters: Array.isArray(starters) ? starters : [],
  });
}

async function writeWorkFolderTasks(tasks) {
  await writeWorkFolderJson(WORK_FOLDER_TASK_DIR, WORK_FOLDER_TASKS_FILE, {
    version: GOOGLE_DRIVE_SYNC_VERSION,
    updatedAt: new Date().toISOString(),
    tasks: Array.isArray(tasks) ? tasks : [],
  });
}

async function writeWorkFolderSyncPayload(payload) {
  await writeWorkFolderJson(WORK_FOLDER_SYNC_DIR, GOOGLE_DRIVE_SYNC_FILE_NAME, payload);
}

async function pushWorkFolderSync() {
  const payload = await buildGoogleDriveSyncPayload();
  await writeWorkFolderSyncPayload(payload);
  await writeWorkFolderStarters(payload.customStarters);
  await writeWorkFolderTasks(payload.tasks);
  return {
    pushedAt: payload.updatedAt,
    payload,
  };
}

async function pullWorkFolderSync() {
  let payload = null;

  try {
    payload = await readWorkFolderJson(WORK_FOLDER_SYNC_DIR, GOOGLE_DRIVE_SYNC_FILE_NAME);
  } catch (_error) {
    const [startersPayload, tasksPayload] = await Promise.all([
      readWorkFolderJson(WORK_FOLDER_SKILL_DIR, WORK_FOLDER_STARTERS_FILE).catch(() => null),
      readWorkFolderJson(WORK_FOLDER_TASK_DIR, WORK_FOLDER_TASKS_FILE).catch(() => null),
    ]);
    payload = {
      version: GOOGLE_DRIVE_SYNC_VERSION,
      updatedAt: new Date().toISOString(),
      customStarters: Array.isArray(startersPayload?.customStarters) ? startersPayload.customStarters : [],
      tasks: Array.isArray(tasksPayload?.tasks) ? tasksPayload.tasks : [],
      latestChatSession: null,
      documents: [],
    };
  }

  const mergedPayload = await applyGoogleDriveSyncPayload(payload || {});
  await writeWorkFolderSyncPayload(mergedPayload);
  await writeWorkFolderStarters(mergedPayload.customStarters);
  await writeWorkFolderTasks(mergedPayload.tasks);
  return {
    pulledAt: new Date().toISOString(),
    payload: mergedPayload,
  };
}

async function maybePushWorkFolderSync() {
  try {
    const handle = await getWorkFolderHandle();
    if (!handle || !isDirectoryHandleLike(handle)) {
      return;
    }
    await pushWorkFolderSync();
  } catch (error) {
    console.warn("[Edge AI Chat] Failed to sync local work folder", error);
  }
}

function normalizeBatchUrlQaCount(value) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_BATCH_URL_QA_COUNT;
  }
  return Math.min(8, Math.max(2, parsed));
}

function normalizeBatchUrlQaOutputFormat(value) {
  return value === BATCH_URL_QA_OUTPUT_FORMATS.txt
    ? BATCH_URL_QA_OUTPUT_FORMATS.txt
    : BATCH_URL_QA_OUTPUT_FORMATS.jsonl;
}

function getBatchUrlQaFilenameExtension(outputFormat) {
  return normalizeBatchUrlQaOutputFormat(outputFormat) === BATCH_URL_QA_OUTPUT_FORMATS.txt ? ".txt" : ".jsonl";
}

function normalizeBatchUrlQaFilename(value, outputFormat = BATCH_URL_QA_OUTPUT_FORMATS.jsonl) {
  const extension = getBatchUrlQaFilenameExtension(outputFormat);
  const fallback = `batch-url-qa-${timestampForFile()}${extension}`;
  const normalized = sanitizeFileSegment(String(value || "").replace(/\.(md|jsonl|txt)$/i, ""), "batch-url-qa");
  return `${normalized || fallback.replace(/\.(jsonl|txt)$/i, "")}${extension}`;
}

function splitFilenameParts(value) {
  const fileName = String(value || "").trim();
  const match = fileName.match(/^(.*?)(\.[^.]+)?$/);
  return {
    stem: (match?.[1] || fileName || "file").trim() || "file",
    ext: match?.[2] || "",
  };
}

async function workFolderFileExists(path, fileName) {
  const rootHandle = await getWritableWorkFolderHandle();
  const directoryHandle = await ensureDirectoryHandle(rootHandle, path);
  try {
    await directoryHandle.getFileHandle(String(fileName || "").trim());
    return true;
  } catch (error) {
    const errorName = error && typeof error === "object" && "name" in error ? String(error.name || "") : "";
    if (errorName === "NotFoundError") {
      return false;
    }
    throw error;
  }
}

async function ensureUniqueBatchUrlQaFilename(fileName, options = {}) {
  const normalized = normalizeBatchUrlQaFilename(fileName, options.outputFormat);
  const excludedJobId = String(options.excludeJobId || "").trim();
  const jobs = await getBatchUrlQaJobs();
  const reservedNames = new Set(
    jobs
      .filter((job) => job.id !== excludedJobId)
      .map((job) => String(job.fileName || "").trim().toLowerCase())
      .filter(Boolean),
  );
  const { stem, ext } = splitFilenameParts(normalized);
  let attempt = 1;
  let candidate = normalized;
  while (reservedNames.has(candidate.toLowerCase()) || await workFolderFileExists(WORK_FOLDER_DATASET_DIR, candidate)) {
    attempt += 1;
    candidate = `${stem}-${attempt}${ext}`;
  }
  return candidate;
}

function normalizeBatchUrl(value) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return "";
  }
  try {
    const url = new URL(normalized);
    if (!/^https?:$/i.test(url.protocol)) {
      return "";
    }
    return url.href;
  } catch (_error) {
    return "";
  }
}

function parseBatchUrlInput(value) {
  const rawItems = String(value || "")
    .split(/\r?\n|[\s,]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
  const urls = [];
  const invalid = [];

  rawItems.forEach((item) => {
    const normalized = normalizeBatchUrl(item);
    if (!normalized) {
      invalid.push(item);
      return;
    }
    if (!urls.includes(normalized)) {
      urls.push(normalized);
    }
  });

  return {
    urls: urls.slice(0, MAX_BATCH_URL_QA_ITEMS),
    invalid,
    truncated: urls.length > MAX_BATCH_URL_QA_ITEMS,
  };
}

function normalizeBatchUrlQaQuestions(value) {
  const rawItems = Array.isArray(value)
    ? value
    : [value];
  return rawItems
    .flatMap((item) => String(item || "")
      .split(/\r?\n|[|；;]+/g)
      .map((part) => normalizeTaskText(part || "", 500)))
    .filter(Boolean)
    .filter((item, index, list) => list.findIndex((candidate) => candidate.toLowerCase() === item.toLowerCase()) === index)
    .filter((item) => !isWeakTrainingQuestion(item))
    .slice(0, 4);
}

function hasEmbeddedQaMarker(value, selfLabel) {
  const text = String(value || "").trim();
  if (!text) {
    return false;
  }
  const otherLabel = selfLabel === "Q" ? "A" : "Q";
  const selfPattern = new RegExp(`(?:\\r?\\n|[\\s，,。！？!?])${selfLabel}\\s*:`, "i");
  const otherPattern = new RegExp(`(?:\\r?\\n|[\\s，,。！？!?])${otherLabel}\\s*:`, "i");
  return selfPattern.test(text) || otherPattern.test(text);
}

function normalizeBatchUrlQaPair(item = {}) {
  const rawQuestions = Array.isArray(item.question_variants || item.questionVariants || item.questions)
    ? (item.question_variants || item.questionVariants || item.questions)
    : [item.question_variants || item.questionVariants || item.questions || item.question || ""];
  if (rawQuestions.some((question) => hasEmbeddedQaMarker(question, "Q"))) {
    return null;
  }
  if (hasEmbeddedQaMarker(item.answer || "", "A") || hasEmbeddedQaMarker(item.evidence || "", "A")) {
    return null;
  }
  const questionVariants = normalizeBatchUrlQaQuestions(
    item.question_variants || item.questionVariants || item.questions || item.question || "",
  );
  const answer = normalizeTaskText(item.answer || "", 1500);
  const evidence = normalizeTaskText(item.evidence || "", 1200);
  const topic = normalizeTaskText(item.topic || item.subject || "", 300);
  if (!questionVariants.length || !answer || !evidence) {
    return null;
  }
  if (isLowSignalBatchUrlQaPair(questionVariants, answer, evidence)) {
    return null;
  }
  return { topic, questions: questionVariants, answer, evidence };
}

function normalizeQaTextForSimilarity(value, { stripQuestionWords = false } = {}) {
  let normalized = String(value || "")
    .toLowerCase()
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 $2")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[「」『』（）()\[\]{}<>《》"'",.，。！？!?:：;；、\-/\\|_*`~+=]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (stripQuestionWords) {
    normalized = normalized
      .replace(/^(請問|請教|想問|我想知道|請說明|說明一下|可否|可以|能否|能不能|是否|有沒有|怎麼|如何|怎样|怎樣|what is|what are|what does|how to|how do i|how can i|can i|can we|is it possible to)\s+/i, "")
      .replace(/\s+(嗎|呢|呀|嗎？|\?)$/i, "")
      .replace(/\b(如何|怎麼|怎样|怎樣|why|what|when|where|which|who|how)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  return normalized;
}

function buildQaCharBigrams(value) {
  const text = String(value || "").trim();
  if (!text) {
    return [];
  }
  if (text.length < 2) {
    return [text];
  }
  const grams = [];
  for (let index = 0; index < text.length - 1; index += 1) {
    grams.push(text.slice(index, index + 2));
  }
  return grams;
}

function computeQaDiceSimilarity(left, right) {
  const leftGrams = buildQaCharBigrams(left);
  const rightGrams = buildQaCharBigrams(right);
  if (!leftGrams.length || !rightGrams.length) {
    return 0;
  }
  const counts = new Map();
  for (const gram of leftGrams) {
    counts.set(gram, (counts.get(gram) || 0) + 1);
  }
  let overlap = 0;
  for (const gram of rightGrams) {
    const count = counts.get(gram) || 0;
    if (count > 0) {
      overlap += 1;
      counts.set(gram, count - 1);
    }
  }
  return (2 * overlap) / (leftGrams.length + rightGrams.length);
}

function isLowSignalBatchUrlQaPair(questions, answer, evidence) {
  const primaryQuestion = Array.isArray(questions) ? questions[0] || "" : questions || "";
  const normalizedQuestion = normalizeQaTextForSimilarity(primaryQuestion, { stripQuestionWords: true });
  const normalizedAnswer = normalizeQaTextForSimilarity(answer);
  const normalizedEvidence = normalizeQaTextForSimilarity(evidence);

  if (!normalizedQuestion || !normalizedAnswer || !normalizedEvidence) {
    return true;
  }

  if (isWeakTrainingQuestion(primaryQuestion)) {
    return true;
  }

  if (normalizedQuestion === normalizedAnswer) {
    return true;
  }

  const similarity = computeQaDiceSimilarity(normalizedQuestion, normalizedAnswer);
  if (similarity >= 0.88) {
    return true;
  }

  const answerWordCount = normalizedAnswer.split(" ").filter(Boolean).length;
  if (answerWordCount <= 2 && normalizedAnswer.length < 12) {
    return true;
  }

  if (!normalizedEvidence.includes(normalizedAnswer) && similarity >= 0.78) {
    return true;
  }

  return false;
}

function estimateBatchUrlQaTargetCount(pageText, headings, requestedCap = DEFAULT_BATCH_URL_QA_COUNT) {
  const cap = Math.min(8, Math.max(2, Number(requestedCap) || DEFAULT_BATCH_URL_QA_COUNT));
  const text = String(pageText || "").trim();
  const headingText = String(headings || "").trim();
  const textLength = text.length;
  const headingCount = headingText
    ? headingText.split(/\n+/).map((item) => item.trim()).filter(Boolean).length
    : 0;

  let score = 0;
  if (textLength >= 1200) score += 1;
  if (textLength >= 2500) score += 1;
  if (textLength >= 4500) score += 1;
  if (textLength >= 7000) score += 1;
  if (headingCount >= 4) score += 1;
  if (headingCount >= 8) score += 1;

  const dynamicTarget = Math.min(8, Math.max(2, 2 + score));
  return Math.min(cap, dynamicTarget);
}

function normalizeBatchUrlQaScopeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 $2")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[【】\[\]（）()<>《》「」『』"'`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanBatchUrlQaAnchorTerm(value) {
  return String(value || "")
    .replace(/(?:^|\s)(faq|how to|how do i|how can i|what is|what are|enable|enabled|set up|setup|configure|config|guide|tutorial|support)(?:\s|$)/gi, " ")
    .replace(/(?:^|\s)(如何|怎麼|怎样|怎樣|設定|設置|啟用|开启|開啟|功能|教學|說明|常見問題|問題)(?:\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[，,、；;:：.\- ]+|[，,、；;:：.\- ]+$/gu, "");
}

function extractBatchUrlQaScopeAnchors(title, headings) {
  const lines = [title, ...(String(headings || "").split(/\n+/).slice(0, 6))]
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  const candidates = new Set();

  for (const line of lines) {
    const bracketMatches = Array.from(line.matchAll(/[\[\(（【]([^\]\)）】]{2,40})[\]\)）】]/g));
    bracketMatches.forEach((match) => candidates.add(cleanBatchUrlQaAnchorTerm(match[1] || "")));

    const parts = line
      .split(/[|｜:：\-–—/·•,，。！？!?\n]/)
      .map((part) => cleanBatchUrlQaAnchorTerm(part))
      .filter(Boolean);
    parts.forEach((part) => candidates.add(part));
  }

  return Array.from(candidates)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2)
    .filter((item, index, list) => list.findIndex((candidate) => candidate.toLowerCase() === item.toLowerCase()) === index)
    .sort((left, right) => right.length - left.length)
    .slice(0, 8);
}

function isBatchUrlQaPairAlignedToScope(pair, { title = "", headings = "" } = {}) {
  const anchors = extractBatchUrlQaScopeAnchors(title, headings);
  if (anchors.length < 2) {
    return true;
  }
  const questionText = normalizeBatchUrlQaScopeText([
    pair?.topic || "",
    ...(Array.isArray(pair?.questions) ? pair.questions : []),
  ].join(" "));
  const combinedText = normalizeBatchUrlQaScopeText([
    questionText,
    pair?.answer || "",
  ].join(" "));
  const questionHits = anchors.filter((anchor) => questionText.includes(normalizeBatchUrlQaScopeText(anchor))).length;
  const combinedHits = anchors.filter((anchor) => combinedText.includes(normalizeBatchUrlQaScopeText(anchor))).length;

  return questionHits >= Math.min(2, anchors.length) && combinedHits >= Math.min(2, anchors.length);
}

function isWeakTrainingQuestion(question) {
  const rawQuestion = String(question || "").trim();
  const normalized = normalizeQaTextForSimilarity(rawQuestion, { stripQuestionWords: false });
  if (!normalized) {
    return true;
  }

  const stepDependentPatterns = [
    /第\s*[一二三四五六七八九十0-9]+\s*步/,
    /\b(first|second|third|next|final)\s+step\b/i,
    /(下一步|上一步|前一步|最後一步|步驟\d+|步骤\d+)/,
    /(第一個步驟|第一步驟|第一步需要做什麼|下一步需要做什麼)/,
  ];
  if (stepDependentPatterns.some((pattern) => pattern.test(rawQuestion))) {
    return true;
  }

  const contextDependentPatterns = [
    /^(這裡|這個|這頁|此頁|上述|以上|這篇|本文|本頁)/,
    /\b(this page|this article|this step|above|here)\b/i,
  ];
  if (contextDependentPatterns.some((pattern) => pattern.test(rawQuestion))) {
    return true;
  }

  const genericActionPatterns = [
    /(需要做什麼|該做什麼|怎麼做|如何做|如何設定|如何操作)/,
    /\b(what should i do|what do i need to do|how do i do this|how do i set this up)\b/i,
  ];
  const hasSpecificNamedEntity = /([A-Z][A-Za-z0-9_-]{2,}|AiMesh|ASUS|Go\s*系列|Travel\s*Mode|web\s*gui|router|路由器|多功能按鈕|按鈕功能)/i.test(rawQuestion);
  if (genericActionPatterns.some((pattern) => pattern.test(rawQuestion)) && !hasSpecificNamedEntity) {
    return true;
  }

  return false;
}

function normalizeBatchUrlQaResult(item = {}) {
  const status = String(item.status || "").trim().toLowerCase() === "ok" ? "ok" : "failed";
  const qaPairs = status === "ok" && Array.isArray(item.qaPairs)
    ? item.qaPairs.map((entry) => normalizeBatchUrlQaPair(entry)).filter(Boolean)
    : [];
  return {
    url: normalizeTaskText(item.url || "", 1200),
    title: normalizeTaskText(item.title || "", 300),
    status,
    reason: status === "failed" ? normalizeTaskText(item.reason || "", 500) : "",
    qaPairs,
    processedAt: normalizeTaskIsoDate(item.processedAt || "") || new Date().toISOString(),
  };
}

function normalizeBatchUrlQaJob(job = {}) {
  const parsed = parseBatchUrlInput(Array.isArray(job.urls) ? job.urls.join("\n") : job.urls || "");
  const nowIso = new Date().toISOString();
  const status = ["queued", "running", "completed", "failed", "canceled"].includes(String(job.status || "").trim()) ? String(job.status).trim() : "queued";
  const outputFormat = normalizeBatchUrlQaOutputFormat(job.outputFormat);
  return {
    id: normalizeTaskText(job.id || "", 120) || createStableId("batch-url-qa"),
    createdAt: normalizeTaskIsoDate(job.createdAt || "") || nowIso,
    updatedAt: normalizeTaskIsoDate(job.updatedAt || "") || nowIso,
    startedAt: normalizeTaskIsoDate(job.startedAt || ""),
    finishedAt: normalizeTaskIsoDate(job.finishedAt || ""),
    status,
    model: normalizeTaskText(job.model || "", 200),
    outputLanguage: normalizeTaskText(job.outputLanguage || "", 40) || "zh-TW",
    outputFormat,
    prompt: normalizeTaskText(job.prompt || job.extraPrompt || "", 16000),
    qaPerUrl: normalizeBatchUrlQaCount(job.qaPerUrl),
    fileName: normalizeBatchUrlQaFilename(job.fileName, outputFormat),
    urls: parsed.urls,
    invalidUrls: Array.isArray(job.invalidUrls) ? job.invalidUrls.map((item) => String(item || "").trim()).filter(Boolean) : parsed.invalid,
    truncated: Boolean(job.truncated || parsed.truncated),
    progress: Number.isFinite(Number(job.progress)) ? Math.max(0, Number(job.progress)) : 0,
    total: Number.isFinite(Number(job.total)) ? Math.max(0, Number(job.total)) : parsed.urls.length,
    successCount: Number.isFinite(Number(job.successCount)) ? Math.max(0, Number(job.successCount)) : 0,
    failureCount: Number.isFinite(Number(job.failureCount)) ? Math.max(0, Number(job.failureCount)) : 0,
    error: normalizeTaskText(job.error || "", 500),
    outputPath: normalizeTaskText(job.outputPath || "", 1200),
    stage: normalizeTaskText(job.stage || "", 60) || (status === "completed" ? "completed" : status === "failed" ? "failed" : "queued"),
    stageLabel: normalizeTaskText(job.stageLabel || "", 240),
    currentUrl: normalizeTaskText(job.currentUrl || "", 1200),
    currentIndex: Number.isFinite(Number(job.currentIndex)) ? Math.max(0, Number(job.currentIndex)) : 0,
    results: Array.isArray(job.results) ? job.results.map((item) => normalizeBatchUrlQaResult(item)).filter(Boolean) : [],
  };
}

async function getBatchUrlQaJobs() {
  const stored = await chrome.storage.local.get(BATCH_URL_QA_JOBS_KEY);
  const jobs = Array.isArray(stored?.[BATCH_URL_QA_JOBS_KEY]) ? stored[BATCH_URL_QA_JOBS_KEY] : [];
  return jobs
    .map((job) => normalizeBatchUrlQaJob(job))
    .sort((left, right) => (Date.parse(right.updatedAt || "") || 0) - (Date.parse(left.updatedAt || "") || 0));
}

async function saveBatchUrlQaJobs(jobs = []) {
  const normalized = jobs.map((job) => normalizeBatchUrlQaJob(job))
    .sort((left, right) => (Date.parse(right.updatedAt || "") || 0) - (Date.parse(left.updatedAt || "") || 0))
    .slice(0, 20);
  await chrome.storage.local.set({ [BATCH_URL_QA_JOBS_KEY]: normalized });
  return normalized;
}

async function upsertBatchUrlQaJob(jobInput = {}) {
  const jobs = await getBatchUrlQaJobs();
  const normalized = normalizeBatchUrlQaJob(jobInput);
  const index = jobs.findIndex((item) => item.id === normalized.id);
  const nextJobs = [...jobs];
  if (index >= 0) {
    nextJobs[index] = { ...jobs[index], ...normalized };
  } else {
    nextJobs.unshift(normalized);
  }
  const saved = await saveBatchUrlQaJobs(nextJobs);
  return saved.find((item) => item.id === normalized.id) || normalized;
}

async function getBatchUrlQaJobById(jobId) {
  const jobs = await getBatchUrlQaJobs();
  return jobs.find((item) => item.id === jobId) || null;
}

function createBatchUrlQaCanceledError() {
  const error = new Error("Batch URL QA job was canceled.");
  error.name = "BatchUrlQaCanceledError";
  return error;
}

function isBatchUrlQaCanceledError(error) {
  return error instanceof Error && error.name === "BatchUrlQaCanceledError";
}

async function throwIfBatchUrlQaCanceled(jobId) {
  const latestJob = await getBatchUrlQaJobById(jobId);
  if (!latestJob) {
    throw new Error("Batch URL QA job not found.");
  }
  if (latestJob.status === "canceled") {
    throw createBatchUrlQaCanceledError();
  }
  return latestJob;
}

async function cancelBatchUrlQaJob(jobId) {
  const current = await getBatchUrlQaJobById(jobId);
  if (!current) {
    throw new Error("Batch URL QA job not found.");
  }
  if (current.status === "completed" || current.status === "failed" || current.status === "canceled") {
    return current;
  }
  return upsertBatchUrlQaJob({
    ...current,
    updatedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    status: "canceled",
    stage: "canceled",
    stageLabel: "Canceled",
    error: "",
  });
}

function extractJsonObjectFromText(value) {
  const text = String(value || "").trim();
  if (!text) {
    throw new Error("Model returned an empty response.");
  }
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1]?.trim() || text;

  const firstObjectBrace = candidate.indexOf("{");
  const lastObjectBrace = candidate.lastIndexOf("}");
  if (firstObjectBrace >= 0 && lastObjectBrace >= firstObjectBrace) {
    return JSON.parse(candidate.slice(firstObjectBrace, lastObjectBrace + 1));
  }

  const firstArrayBrace = candidate.indexOf("[");
  const lastArrayBrace = candidate.lastIndexOf("]");
  if (firstArrayBrace >= 0 && lastArrayBrace >= firstArrayBrace) {
    return JSON.parse(candidate.slice(firstArrayBrace, lastArrayBrace + 1));
  }

  throw new Error("Model did not return JSON.");
}

function buildDefaultBatchUrlQaPromptTemplate({ qaPerUrl, outputLanguage, outputFormat } = {}) {
  const resolvedCount = Math.max(1, Math.min(8, Number(qaPerUrl) || 8));
  const resolvedLanguage = String(outputLanguage || "zh-TW").trim() || "zh-TW";
  const resolvedFormat = normalizeBatchUrlQaOutputFormat(outputFormat);
  return [
    "You are creating grounded FAQ training data from a single webpage.",
    "Return one JSON object only.",
    `Generate exactly ${resolvedCount} FAQ items from the provided page.`,
    `Write every question variant and answer in this language: ${resolvedLanguage}.`,
    resolvedFormat === BATCH_URL_QA_OUTPUT_FORMATS.txt
      ? "The final export target is plaintext .txt. Make the first question_variants entry read naturally as the standalone Q line for a Q:/A: block."
      : "The final export target is JSONL. Make the first question_variants entry the clean canonical question for each record.",
    "Rules:",
    "1. Use only the provided webpage content for all questions, answers, and evidence.",
    "2. Do not use outside knowledge.",
    "3. Each FAQ item must represent one meaningful knowledge unit, not one arbitrary sentence or one narrow step-number fact.",
    "4. Each FAQ item must include topic, question_variants, answer, and evidence.",
    "5. question_variants must contain 2 to 4 natural user questions that all map to the same answer.",
    "6. Prefer standalone questions that still make sense outside the original page.",
    "7. Avoid weak question forms like 'what is the first step', 'what should I do next', or questions that depend on page order or nearby context words such as this page / here / above.",
    "8. Prefer questions about capabilities, definitions, requirements, differences, configuration targets, limitations, or complete procedures over narrow step-number trivia.",
    "9. If the answer is procedural, rewrite it into a complete step-by-step answer that preserves the real sequence and key conditions from the page.",
    "10. The answer must add concrete information from the page, such as steps, conditions, settings, limits, names, or outcomes.",
    "11. Do not make the answer a near-copy, grammatical rewrite, or trivial paraphrase of any question variant.",
    "12. Evidence must be a short supporting passage copied from the provided page text.",
    "13. If the page only hints at a topic but does not provide a concrete answer, skip that topic instead of guessing.",
    "14. The page title is the primary topic boundary. Keep every FAQ item aligned with the exact scope implied by the title and headings. Do not broaden a narrower page topic into a more general product question.",
    "15. Example: if the page is about using a multi-function button to trigger VPN Fusion, do not write generic questions about enabling VPN Fusion overall. The question must preserve the multi-function-button scope.",
    '16. JSON schema: {"qa_pairs":[{"topic":"...","question_variants":["...","..."],"answer":"...","evidence":"..."}]}',
    "17. Do not repeat or paraphrase the existing FAQ items listed below. Only create new ones.",
    "",
    "URL: {{url}}",
    "Title: {{title}}",
    "Meta description: {{metaDescription}}",
    "Headings: {{headings}}",
    "",
    "EXISTING QA PAIRS TO AVOID",
    "{{existingPairsSection}}",
    "",
    "PAGE TEXT",
    "{{pageText}}",
  ].join("\n");
}

function extractBatchUrlQaPairsFromPayload(payload) {
  const normalizedPayload = payload && typeof payload === "object" ? payload : {};
  if (Array.isArray(payload)) {
    return payload;
  }

  const candidateLists = [
    normalizedPayload.qa_pairs,
    normalizedPayload.qaPairs,
    normalizedPayload.faq_items,
    normalizedPayload.faqItems,
    normalizedPayload.items,
    normalizedPayload.results,
    normalizedPayload.faqs,
    normalizedPayload.data?.qa_pairs,
    normalizedPayload.data?.qaPairs,
    normalizedPayload.data?.items,
    normalizedPayload.output?.qa_pairs,
    normalizedPayload.output?.qaPairs,
  ];

  return candidateLists.find((item) => Array.isArray(item)) || [];
}

function buildBatchUrlQaPrompt({
  url,
  title,
  metaDescription,
  headings,
  pageText,
  qaPerUrl,
  outputLanguage,
  prompt,
  existingPairs = [],
}) {
  const trimmedText = String(pageText || "").trim().slice(0, 12000);
  const remainingCount = Math.max(1, Number(qaPerUrl) || 1);
  const existingSummary = Array.isArray(existingPairs) && existingPairs.length
    ? existingPairs
      .map((pair, index) => `${index + 1}. Topic: ${pair.topic || "-"}\nQuestions: ${(pair.questions || []).join(" | ")}\nAnswer: ${pair.answer}`)
      .join("\n")
    : "";
  const template = String(prompt || "").trim() || buildDefaultBatchUrlQaPromptTemplate({
    qaPerUrl: remainingCount,
    outputLanguage,
  });
  return template
    .replaceAll("{{qaPerUrl}}", String(remainingCount))
    .replaceAll("{{outputLanguage}}", String(outputLanguage || "zh-TW"))
    .replaceAll("{{url}}", String(url || ""))
    .replaceAll("{{title}}", String(title || ""))
    .replaceAll("{{metaDescription}}", String(metaDescription || ""))
    .replaceAll("{{headings}}", String(headings || ""))
    .replaceAll("{{existingPairsSection}}", existingSummary)
    .replaceAll("{{pageText}}", trimmedText || "(empty)");
}

async function waitForTabCompletion(tabId, timeoutMs = 30000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const tab = await chrome.tabs.get(tabId).catch(() => null);
    if (!tab) {
      throw new Error("Tab was closed before the page finished loading.");
    }
    if (tab.status === "complete") {
      return tab;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Timed out while waiting for the page to load.");
}

async function getPageContextFromUrl(url) {
  const tab = await chrome.tabs.create({ url, active: false });
  try {
    await waitForTabCompletion(Number(tab.id));
    let injectedFallback = false;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        const response = await chrome.tabs.sendMessage(Number(tab.id), { type: "edge-ai-chat:get-page-context", expandDetails: true });
        if (response?.ok && response.context) {
          return response.context;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!injectedFallback && /Receiving end does not exist|Could not establish connection/i.test(message)) {
          injectedFallback = true;
          try {
            await injectContentScriptsIntoTab(Number(tab.id));
          } catch (_ignored) {
            // Fall through to retry loop.
          }
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
    throw new Error("Page context was unavailable for this URL.");
  } finally {
    if (Number.isFinite(Number(tab.id))) {
      await chrome.tabs.remove(Number(tab.id)).catch(() => {});
    }
  }
}

function mergeUniqueBatchUrlQaPairs(existingPairs = [], incomingPairs = []) {
  const merged = [];
  const seen = new Set();
  for (const pair of [...existingPairs, ...incomingPairs]) {
    const normalized = normalizeBatchUrlQaPair(pair);
    if (!normalized) {
      continue;
    }
    const key = `${normalized.topic}|${normalized.answer}`.trim().toLowerCase();
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(normalized);
  }
  return merged;
}

function convertPlainUrlsToMarkdownLinks(value) {
  const text = String(value || "");
  if (!text) {
    return "";
  }
  return text.replace(/(?<!\]\()https?:\/\/[^\s)]+/gi, (rawUrl) => {
    const trimmedUrl = rawUrl.replace(/[.,!?;:]+$/g, "");
    const trailing = rawUrl.slice(trimmedUrl.length);
    if (!trimmedUrl) {
      return rawUrl;
    }
    return `[${trimmedUrl}](${trimmedUrl})${trailing}`;
  });
}

function normalizeBatchUrlQaOutputLine(value) {
  return String(value || "")
    .replace(/^\s*[，,、；;:：.\-]+\s*/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripLeadingQaLabel(value, label) {
  const pattern = new RegExp(`^\\s*${label}\\s*:\\s*`, "i");
  return String(value || "").replace(pattern, "").trim();
}

function truncateEmbeddedQaMarker(value, markerLabel) {
  const text = String(value || "");
  if (!text) {
    return "";
  }
  const pattern = new RegExp(`(?:\\r?\\n|[\\s，,。！？!?])${markerLabel}\\s*:`, "i");
  const match = pattern.exec(text);
  if (!match || typeof match.index !== "number") {
    return text;
  }
  return text.slice(0, match.index).trim().replace(/[，,、；;:：.\-]+\s*$/u, "").trim();
}

function buildBatchUrlQaJsonl(results = []) {
  const entries = (Array.isArray(results) ? results : [])
    .filter((item) => item.status === "ok" && Array.isArray(item.qaPairs) && item.qaPairs.length)
    .flatMap((item) => item.qaPairs.map((pair, pairIndex) => {
      const questions = Array.isArray(pair.questions)
        ? pair.questions
          .map((question) => normalizeBatchUrlQaOutputLine(
            truncateEmbeddedQaMarker(
              stripLeadingQaLabel(convertPlainUrlsToMarkdownLinks(question), "Q"),
              "A",
            ),
          ))
          .filter(Boolean)
        : [];
      const answer = normalizeBatchUrlQaOutputLine(
        truncateEmbeddedQaMarker(
          stripLeadingQaLabel(convertPlainUrlsToMarkdownLinks(pair.answer), "A"),
          "Q",
        ),
      );
      const evidence = normalizeBatchUrlQaOutputLine(
        truncateEmbeddedQaMarker(
          stripLeadingQaLabel(convertPlainUrlsToMarkdownLinks(pair.evidence), "Evidence"),
          "Q",
        ),
      );
      if (!questions.length || !answer || !evidence) {
        return "";
      }
      const canonicalQuestion = questions[0];
      const aliases = questions.slice(1);
      return JSON.stringify({
        chunk_id: `${item.processedAt || "batch-url-qa"}::${pairIndex + 1}::${normalizeTaskText(item.url || "", 200)}`,
        source_url: normalizeTaskText(item.url || "", 1200),
        source_title: normalizeTaskText(item.title || "", 300),
        processed_at: normalizeTaskIsoDate(item.processedAt || "") || new Date().toISOString(),
        topic: normalizeTaskText(pair.topic || "", 300),
        canonical_question: canonicalQuestion,
        question_aliases: aliases,
        answer,
        evidence,
      });
    }))
    .filter(Boolean);
  return entries.length ? `${entries.join("\n")}\n` : "";
}

function buildBatchUrlQaPlainText(results = []) {
  const entries = (Array.isArray(results) ? results : [])
    .filter((item) => item.status === "ok" && Array.isArray(item.qaPairs) && item.qaPairs.length)
    .flatMap((item) => item.qaPairs.map((pair) => {
      const question = normalizeBatchUrlQaOutputLine(
        truncateEmbeddedQaMarker(
          stripLeadingQaLabel(convertPlainUrlsToMarkdownLinks(Array.isArray(pair.questions) ? pair.questions[0] || "" : ""), "Q"),
          "A",
        ),
      );
      const answer = normalizeBatchUrlQaOutputLine(
        truncateEmbeddedQaMarker(
          stripLeadingQaLabel(convertPlainUrlsToMarkdownLinks(pair.answer), "A"),
          "Q",
        ),
      );
      if (!question || !answer) {
        return "";
      }
      return `Q: ${question}\nA: ${answer}`;
    }))
    .filter(Boolean);
  return entries.length ? `${entries.join("\n\n")}\n` : "";
}

function buildBatchUrlQaOutput(results = [], outputFormat = BATCH_URL_QA_OUTPUT_FORMATS.jsonl) {
  return normalizeBatchUrlQaOutputFormat(outputFormat) === BATCH_URL_QA_OUTPUT_FORMATS.txt
    ? buildBatchUrlQaPlainText(results)
    : buildBatchUrlQaJsonl(results);
}

async function generateQaPairsForPage({ url, title, metaDescription, headings, pageText, qaPerUrl, model, outputLanguage, prompt }) {
  const targetCount = estimateBatchUrlQaTargetCount(pageText, headings, qaPerUrl);
  let collectedPairs = [];
  const maxAttempts = 3;

  for (let attempt = 0; attempt < maxAttempts && collectedPairs.length < targetCount; attempt += 1) {
    const response = await generateWithConfiguredProvider(
      buildBatchUrlQaPrompt({
        url,
        title,
        metaDescription,
        headings,
        pageText,
        qaPerUrl: targetCount - collectedPairs.length,
        outputLanguage,
        prompt,
        existingPairs: collectedPairs,
      }),
      model,
    );
    const parsed = extractJsonObjectFromText(response?.response || "");
    const normalizedPairs = extractBatchUrlQaPairsFromPayload(parsed)
      .map((item) => normalizeBatchUrlQaPair(item))
      .filter(Boolean);
    const scopedPairs = normalizedPairs.filter((item) => isBatchUrlQaPairAlignedToScope(item, { title, headings }));
    const qaPairs = scopedPairs.length ? scopedPairs : normalizedPairs;
    collectedPairs = mergeUniqueBatchUrlQaPairs(collectedPairs, qaPairs);
  }

  if (collectedPairs.length < Math.max(2, Math.min(targetCount, 2))) {
    throw new Error(`Model returned only ${collectedPairs.length} grounded FAQ item(s) after retries.`);
  }
  return collectedPairs.slice(0, targetCount);
}

async function processBatchUrlQaJob(jobId) {
  let job = normalizeBatchUrlQaJob((await getBatchUrlQaJobs()).find((item) => item.id === jobId) || {});
  if (!job.id) {
    throw new Error("Batch URL QA job not found.");
  }
  const outputPath = `${WORK_FOLDER_DATASET_DIR}/${job.fileName}`;
  const nowIso = new Date().toISOString();
  job = await upsertBatchUrlQaJob({
    ...job,
    status: "running",
    startedAt: job.startedAt || nowIso,
    updatedAt: nowIso,
    total: job.urls.length,
    progress: job.results.length,
    outputPath,
    stage: "starting",
    stageLabel: "Preparing batch workflow",
  });
  await writeWorkFolderText(WORK_FOLDER_DATASET_DIR, job.fileName, buildBatchUrlQaOutput(job.results, job.outputFormat));

  for (const [urlIndex, url] of job.urls.entries()) {
    job = await throwIfBatchUrlQaCanceled(jobId);
    if (job.results.some((item) => item.url === url)) {
      continue;
    }

    let result;
    try {
      job = await throwIfBatchUrlQaCanceled(jobId);
      job = await upsertBatchUrlQaJob({
        ...job,
        updatedAt: new Date().toISOString(),
        stage: "reading",
        stageLabel: `Reading page ${urlIndex + 1} of ${job.urls.length}`,
        currentUrl: url,
        currentIndex: urlIndex + 1,
      });
      const context = await getPageContextFromUrl(url);
      const pageText = normalizeMarkdownText(context?.pageText || "");
      if (pageText.length < 500) {
        throw new Error("insufficient_content");
      }
      job = await throwIfBatchUrlQaCanceled(jobId);
      job = await upsertBatchUrlQaJob({
        ...job,
        updatedAt: new Date().toISOString(),
        stage: "generating",
        stageLabel: `Generating QA pairs for page ${urlIndex + 1} of ${job.urls.length}`,
        currentUrl: url,
        currentIndex: urlIndex + 1,
      });
      const qaPairs = await generateQaPairsForPage({
        url,
        title: context?.title || "",
        metaDescription: context?.metaDescription || "",
        headings: context?.headings || "",
        pageText,
        qaPerUrl: job.qaPerUrl,
        model: job.model,
        outputLanguage: job.outputLanguage,
        prompt: job.prompt,
      });
      await throwIfBatchUrlQaCanceled(jobId);
      result = normalizeBatchUrlQaResult({
        url,
        title: context?.title || "",
        status: "ok",
        qaPairs,
      });
    } catch (error) {
      result = normalizeBatchUrlQaResult({
        url,
        status: "failed",
        reason: error instanceof Error ? error.message : String(error),
      });
    }

    job = await upsertBatchUrlQaJob({
      ...job,
      updatedAt: new Date().toISOString(),
      results: [...job.results, result],
      progress: job.results.length + 1,
      successCount: job.successCount + (result.status === "ok" ? 1 : 0),
      failureCount: job.failureCount + (result.status === "failed" ? 1 : 0),
      stage: "collecting",
      stageLabel: `Collected result ${job.results.length + 1} of ${job.urls.length}`,
      currentUrl: url,
      currentIndex: urlIndex + 1,
    });
    await writeWorkFolderText(WORK_FOLDER_DATASET_DIR, job.fileName, buildBatchUrlQaOutput(job.results, job.outputFormat));
  }

  job = await throwIfBatchUrlQaCanceled(jobId);
  job = await upsertBatchUrlQaJob({
    ...job,
    updatedAt: new Date().toISOString(),
    stage: "writing",
    stageLabel: "Writing output file",
  });
  await writeWorkFolderText(WORK_FOLDER_DATASET_DIR, job.fileName, buildBatchUrlQaOutput(job.results, job.outputFormat));
  job = await throwIfBatchUrlQaCanceled(jobId);
  job = await upsertBatchUrlQaJob({
    ...job,
    updatedAt: new Date().toISOString(),
    stage: "notifying",
    stageLabel: "Sending completion notifications",
    outputPath,
  });
  await notifyBatchUrlQaCompletion({
    fileName: job.fileName,
    outputPath,
    model: job.model,
    outputLanguage: job.outputLanguage,
    total: job.urls.length,
    successCount: job.successCount,
    failureCount: job.failureCount,
    finishedAt: new Date().toISOString(),
  });
  job = await throwIfBatchUrlQaCanceled(jobId);
  await upsertBatchUrlQaJob({
    ...job,
    updatedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    status: "completed",
    progress: job.urls.length,
    total: job.urls.length,
    outputPath,
    stage: "completed",
    stageLabel: "Completed",
  });
}

async function startBatchUrlQaJob(input = {}) {
  const config = await getConfig();
  const currentJobs = await getBatchUrlQaJobs();
  if (currentJobs.some((item) => item.status === "running")) {
    throw new Error("Another Batch URL QA job is already running.");
  }
  const parsed = parseBatchUrlInput(input.urls || "");
  if (!parsed.urls.length) {
    throw new Error("Please provide at least one valid HTTP or HTTPS URL.");
  }
  const selectedModel = String(input.model || config.selectedModel || "").trim();
  if (!selectedModel) {
    throw new Error("Pick a model before starting Batch URL QA.");
  }
  await getWritableWorkFolderHandle();
  const outputFormat = normalizeBatchUrlQaOutputFormat(input.outputFormat);
  const uniqueFileName = await ensureUniqueBatchUrlQaFilename(input.fileName, { outputFormat });

  const job = await upsertBatchUrlQaJob({
    id: createStableId("batch-url-qa"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "queued",
    model: selectedModel,
    outputLanguage: String(input.outputLanguage || config.replyLanguage || "zh-TW").trim() || "zh-TW",
    outputFormat,
    prompt: String(input.prompt || input.extraPrompt || "").trim() || buildDefaultBatchUrlQaPromptTemplate({
      qaPerUrl: input.qaPerUrl,
      outputLanguage: input.outputLanguage || config.replyLanguage || "zh-TW",
      outputFormat,
    }),
    qaPerUrl: normalizeBatchUrlQaCount(input.qaPerUrl),
    fileName: uniqueFileName,
    urls: parsed.urls,
    invalidUrls: parsed.invalid,
    truncated: parsed.truncated,
    progress: 0,
    total: parsed.urls.length,
    successCount: 0,
    failureCount: 0,
    stage: "queued",
    stageLabel: "Queued",
    results: [],
  });

  processBatchUrlQaJob(job.id).catch(async (error) => {
    if (isBatchUrlQaCanceledError(error)) {
      return;
    }
    await upsertBatchUrlQaJob({
      ...job,
      updatedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    }).catch(() => {});
  });

  return job;
}

async function syncGoogleDriveNow(direction = "push", interactive = false) {
  const config = await getConfig();
  if (!config.googleDriveSyncEnabled && direction !== "status") {
    throw new Error("Google Drive sync is disabled.");
  }

  if (direction === "pull") {
    const remote = await downloadGoogleDriveSyncPayload(interactive);
    if (!remote) {
      const payload = await buildGoogleDriveSyncPayload();
      await uploadGoogleDriveSyncPayload(payload, interactive);
      return { direction: "push", created: true, payload };
    }
    const payload = await applyGoogleDriveSyncPayload(remote);
    await uploadGoogleDriveSyncPayload(payload, interactive);
    return { direction: "pull", payload };
  }

  const payload = await buildGoogleDriveSyncPayload();
  await uploadGoogleDriveSyncPayload(payload, interactive);
  return { direction: "push", payload };
}

async function maybeAutoSyncGoogleDrive() {
  try {
    const config = await getConfig();
    if (!config.googleDriveSyncEnabled || !config.googleDriveAutoSync) {
      return;
    }
    await syncGoogleDriveNow("push", false);
  } catch (error) {
    await setGoogleDriveSyncMeta({
      lastError: error instanceof Error ? error.message : String(error),
    });
  }
}

async function getGoogleDriveSyncStatus() {
  const config = await getConfig();
  const meta = await getGoogleDriveSyncMeta();
  return {
    enabled: Boolean(config.googleDriveSyncEnabled),
    autoSync: config.googleDriveAutoSync !== false,
    hasClientId: Boolean(sanitizeGoogleDriveClientId(config.googleDriveClientId)),
    connected: Boolean(meta.accessToken && Number(meta.tokenExpiresAt || 0) > Date.now()),
    redirectUrl: chrome.identity?.getRedirectURL ? getGoogleDriveRedirectUrl() : "",
    lastSyncAt: meta.lastSyncAt || "",
    lastError: meta.lastError || "",
    fileId: meta.fileId || "",
  };
}

async function reconcileSelectedModel(config, models) {
  const availableNames = new Set(models.map((model) => model.name).filter(Boolean));
  const hasSelectedModel = Boolean(config.selectedModel);
  const selectedModelStillExists = hasSelectedModel && availableNames.has(config.selectedModel);

  if (selectedModelStillExists) {
    return config;
  }

  if (models.length === 1 && models[0]?.name) {
    return setConfig({ selectedModel: models[0].name });
  }

  if (hasSelectedModel && !selectedModelStillExists) {
    return setConfig({ selectedModel: "" });
  }

  return config;
}

function normalizeBaseUrl(url) {
  return (url || "").trim().replace(/\/+$/, "");
}

function isDisconnectedPortError(error) {
  const message = error instanceof Error ? error.message : String(error || "");
  return /disconnected port object/i.test(message) || /message port closed/i.test(message);
}

function tryPostPortMessage(port, message) {
  try {
    port.postMessage(message);
    return true;
  } catch (error) {
    if (!isDisconnectedPortError(error)) {
      console.warn("[Edge AI Chat] Failed to post port message", error);
    }
    return false;
  }
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(formatHttpError(response.status, text || response.statusText));
  }

  return response.json();
}

async function fetchText(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(formatHttpError(response.status, text || response.statusText));
  }

  return response.text();
}

function formatHttpError(status, responseText = "") {
  const rawText = String(responseText || "").trim();
  if (!rawText) {
    return `HTTP ${status}`;
  }

  try {
    const payload = JSON.parse(rawText);
    const error = payload?.error || payload;
    const message = String(error?.message || "").trim();
    const code = String(error?.code || error?.innererror?.code || "").trim();
    const filterResult = error?.innererror?.content_filter_result || error?.content_filter_result || null;
    const jailbreakDetected = Boolean(filterResult?.jailbreak?.detected || filterResult?.jailbreak?.filtered);

    if (code === "content_filter" || code === "ResponsibleAIPolicyViolation" || filterResult) {
      const reasons = [];
      if (jailbreakDetected) {
        reasons.push("possible prompt-injection or jailbreak-like text was detected in the page context or prompt");
      }
      const summary = reasons.length ? ` ${reasons.join("; ")}.` : "";
      return `HTTP ${status}: The request was blocked by Azure/OpenAI content filtering.${summary} Try reducing page context, selected text, or attached content and retry.`;
    }

    if (message) {
      return `HTTP ${status}: ${message}`;
    }
    if (code) {
      return `HTTP ${status}: ${code}`;
    }
  } catch (_error) {
    // Fall through to plain-text handling.
  }

  const compact = rawText.replace(/\s+/g, " ").trim();
  return `HTTP ${status}: ${compact}`;
}

function formatOllamaPostForbiddenError(status, responseText = "") {
  const compact = String(responseText || "").replace(/\s+/g, " ").trim();
  const suffix = compact ? ` Server said: ${compact}` : "";
  return `HTTP ${status}: Ollama model listing worked, but the remote server rejected the POST chat request.${suffix} This usually means the Ollama host, gateway, or reverse proxy allows GET /api/tags but blocks POST /api/chat or /api/generate. Check OLLAMA_ORIGINS on the Ollama machine and any proxy or firewall rules in front of port 11434.`;
}

function decodeHtmlEntities(value = "") {
  return String(value || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_match, codePoint) => {
      const numeric = Number.parseInt(codePoint, 10);
      return Number.isFinite(numeric) ? String.fromCharCode(numeric) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_match, hexValue) => {
      const numeric = Number.parseInt(hexValue, 16);
      return Number.isFinite(numeric) ? String.fromCharCode(numeric) : "";
    });
}

function stripHtmlTags(value = "") {
  return decodeHtmlEntities(String(value || "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function extractXmlTagContent(block, tagName) {
  const pattern = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = String(block || "").match(pattern);
  return match ? stripHtmlTags(match[1]) : "";
}

async function searchWebResults({ query, limit = 5 } = {}) {
  const normalizedQuery = String(query || "").trim();
  const normalizedLimit = Math.max(1, Math.min(Number.parseInt(String(limit), 10) || 5, 8));

  if (!normalizedQuery) {
    throw new Error("Web search query is missing.");
  }

  const url = new URL("https://www.bing.com/search");
  url.searchParams.set("format", "rss");
  url.searchParams.set("q", normalizedQuery);
  url.searchParams.set("count", String(normalizedLimit));
  url.searchParams.set("setlang", "en-US");

  const xml = await fetchText(url.toString(), {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
    },
  });

  const results = [...String(xml || "").matchAll(/<item\b[\s\S]*?<\/item>/gi)]
    .slice(0, normalizedLimit)
    .map((match) => {
      const block = match[0] || "";
      const title = extractXmlTagContent(block, "title");
      const link = decodeHtmlEntities(extractXmlTagContent(block, "link"));
      const snippet = extractXmlTagContent(block, "description");
      if (!title || !link) {
        return null;
      }
      return {
        title,
        url: link,
        snippet,
        source: "Bing",
      };
    })
    .filter(Boolean);

  return {
    query: normalizedQuery,
    results,
  };
}

function getGithubRequestHeaders(token, accept = "application/vnd.github+json") {
  const headers = {
    Accept: accept,
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function fetchGithubPages(urlFactory, headers, maxPages = 10) {
  const items = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const url = urlFactory(page);
    const payload = await fetchJson(url.toString(), { headers });
    const pageItems = Array.isArray(payload) ? payload : [];
    items.push(...pageItems);

    if (pageItems.length < 100) {
      break;
    }
  }

  return items;
}

async function fetchGithubFile({ owner, repo, path, ref, token }) {
  const normalizedOwner = String(owner || "").trim();
  const normalizedRepo = String(repo || "").trim();
  const normalizedPath = String(path || "").replace(/^\/+/, "").trim();
  const normalizedRef = String(ref || "").trim();

  if (!normalizedOwner || !normalizedRepo || !normalizedPath) {
    throw new Error("GitHub file request is missing owner, repo, or path.");
  }

  const config = await getConfig();
  const githubToken = String(token || config.githubApiKey || "").trim();
  const encodedPath = normalizedPath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const url = new URL(`https://api.github.com/repos/${encodeURIComponent(normalizedOwner)}/${encodeURIComponent(normalizedRepo)}/contents/${encodedPath}`);
  if (normalizedRef) {
    url.searchParams.set("ref", normalizedRef);
  }

  const content = await fetchText(url.toString(), {
    headers: getGithubRequestHeaders(githubToken, "application/vnd.github.raw"),
  });
  return {
    owner: normalizedOwner,
    repo: normalizedRepo,
    path: normalizedPath,
    ref: normalizedRef,
    content,
  };
}

async function listGithubDirectory({ owner, repo, path, ref, token }) {
  const normalizedOwner = String(owner || "").trim();
  const normalizedRepo = String(repo || "").trim();
  const normalizedPath = String(path || "").replace(/^\/+|\/+$/g, "").trim();
  const normalizedRef = String(ref || "").trim();

  if (!normalizedOwner || !normalizedRepo) {
    throw new Error("GitHub directory request is missing owner or repo.");
  }

  const config = await getConfig();
  const githubToken = String(token || config.githubApiKey || "").trim();
  const suffix = normalizedPath
    ? `/${normalizedPath
        .split("/")
        .filter(Boolean)
        .map((segment) => encodeURIComponent(segment))
        .join("/")}`
    : "";
  const url = new URL(`https://api.github.com/repos/${encodeURIComponent(normalizedOwner)}/${encodeURIComponent(normalizedRepo)}/contents${suffix}`);
  if (normalizedRef) {
    url.searchParams.set("ref", normalizedRef);
  }

  const payload = await fetchJson(url.toString(), {
    headers: getGithubRequestHeaders(githubToken),
  });

  const entries = Array.isArray(payload) ? payload : [payload];
  return {
    owner: normalizedOwner,
    repo: normalizedRepo,
    path: normalizedPath,
    ref: normalizedRef,
    entries: entries
      .map((entry) => ({
        name: entry.name || "",
        path: entry.path || "",
        type: entry.type || "",
        size: entry.size || 0,
      }))
      .sort((left, right) => {
        if (left.type === right.type) {
          return left.name.localeCompare(right.name);
        }
        return left.type === "dir" ? -1 : 1;
      }),
  };
}

async function fetchGithubReadme({ owner, repo, ref, token }) {
  const normalizedOwner = String(owner || "").trim();
  const normalizedRepo = String(repo || "").trim();
  const normalizedRef = String(ref || "").trim();

  if (!normalizedOwner || !normalizedRepo) {
    throw new Error("GitHub README request is missing owner or repo.");
  }

  const config = await getConfig();
  const githubToken = String(token || config.githubApiKey || "").trim();
  const url = new URL(`https://api.github.com/repos/${encodeURIComponent(normalizedOwner)}/${encodeURIComponent(normalizedRepo)}/readme`);
  if (normalizedRef) {
    url.searchParams.set("ref", normalizedRef);
  }

  const content = await fetchText(url.toString(), {
    headers: getGithubRequestHeaders(githubToken, "application/vnd.github.raw"),
  });

  return {
    owner: normalizedOwner,
    repo: normalizedRepo,
    ref: normalizedRef,
    content,
  };
}

async function listGithubRepositories({ query, token }) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  const config = await getConfig();
  const githubToken = String(token || config.githubApiKey || "").trim();
  const headers = getGithubRequestHeaders(githubToken);
  const items = [];
  const seenRepoIds = new Set();
  const warnings = [];
  let userRepos = [];

  try {
    userRepos = await fetchGithubPages((page) => {
      const url = new URL("https://api.github.com/user/repos");
      url.searchParams.set("sort", "updated");
      url.searchParams.set("per_page", "100");
      url.searchParams.set("page", String(page));
      url.searchParams.set("affiliation", "owner,collaborator,organization_member");
      return url;
    }, headers);
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : String(error));
  }

  userRepos.forEach((repo) => {
    if (seenRepoIds.has(repo.id)) {
      return;
    }
    seenRepoIds.add(repo.id);
    items.push(repo);
  });

  let orgs = [];
  try {
    orgs = await fetchGithubPages((page) => {
      const url = new URL("https://api.github.com/user/orgs");
      url.searchParams.set("per_page", "100");
      url.searchParams.set("page", String(page));
      return url;
    }, headers, 5);
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : String(error));
  }

  for (const org of orgs) {
    const orgLogin = String(org?.login || "").trim();
    if (!orgLogin) {
      continue;
    }

    let orgRepos = [];
    try {
      orgRepos = await fetchGithubPages((page) => {
        const url = new URL(`https://api.github.com/orgs/${encodeURIComponent(orgLogin)}/repos`);
        url.searchParams.set("type", "all");
        url.searchParams.set("sort", "updated");
        url.searchParams.set("per_page", "100");
        url.searchParams.set("page", String(page));
        return url;
      }, headers);
    } catch (error) {
      warnings.push(`${orgLogin}: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }

    orgRepos.forEach((repo) => {
      if (seenRepoIds.has(repo.id)) {
        return;
      }
      seenRepoIds.add(repo.id);
      items.push(repo);
    });
  }

  return {
    repositories: items
      .map((repo) => ({
        id: repo.id,
        fullName: repo.full_name || "",
        owner: repo.owner?.login || "",
        name: repo.name || "",
        private: Boolean(repo.private),
        defaultBranch: repo.default_branch || "",
      }))
      .filter((repo) => !normalizedQuery || repo.fullName.toLowerCase().includes(normalizedQuery)),
    warnings,
  };
}

async function fetchGithubRepository({ owner, repo, token }) {
  const normalizedOwner = String(owner || "").trim();
  const normalizedRepo = String(repo || "").trim();

  if (!normalizedOwner || !normalizedRepo) {
    throw new Error("GitHub repository request is missing owner or repo.");
  }

  const config = await getConfig();
  const githubToken = String(token || config.githubApiKey || "").trim();
  const url = new URL(`https://api.github.com/repos/${encodeURIComponent(normalizedOwner)}/${encodeURIComponent(normalizedRepo)}`);
  const payload = await fetchJson(url.toString(), {
    headers: getGithubRequestHeaders(githubToken),
  });

  return {
    owner: normalizedOwner,
    repo: normalizedRepo,
    fullName: payload.full_name || `${normalizedOwner}/${normalizedRepo}`,
    defaultBranch: payload.default_branch || "",
    private: Boolean(payload.private),
  };
}

function buildGithubTokenScopeWarning(token) {
  const normalizedToken = normalizeSecretValue(token);
  if (!normalizedToken) {
    return "";
  }

  if (/^github_pat_/i.test(normalizedToken)) {
    return "";
  }

  return "Use a fine-grained GitHub token with read-only repository access when possible.";
}

function getCommonsImageMimeRank(value) {
  const mime = String(value || "").toLowerCase();
  if (mime === "image/jpeg" || mime === "image/png" || mime === "image/webp") {
    return 0;
  }
  if (mime === "image/gif") {
    return 1;
  }
  if (mime === "image/svg+xml") {
    return 2;
  }
  return 3;
}

async function searchCommonsImages({ query, limit = 6 } = {}) {
  const normalizedQuery = String(query || "").trim();
  const normalizedLimit = Math.max(1, Math.min(Number.parseInt(String(limit), 10) || 6, 8));

  if (!normalizedQuery) {
    throw new Error("Commons image search query is missing.");
  }

  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", normalizedQuery);
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("gsrlimit", String(normalizedLimit));
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|mime|size");
  url.searchParams.set("iiurlwidth", "1600");

  const payload = await fetchJson(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  const results = Object.values(payload?.query?.pages || {})
    .map((page) => {
      const imageInfo = Array.isArray(page?.imageinfo) ? page.imageinfo[0] || null : null;
      const originalUrl = String(imageInfo?.url || "").trim();
      const thumbUrl = String(imageInfo?.thumburl || "").trim();
      if (!originalUrl && !thumbUrl) {
        return null;
      }

      return {
        title: String(page?.title || "").replace(/^File:/i, "").trim(),
        descriptionUrl: String(imageInfo?.descriptionurl || "").trim(),
        url: originalUrl,
        thumbUrl,
        mime: String(imageInfo?.mime || "").trim(),
        width: Number(imageInfo?.width) || 0,
        height: Number(imageInfo?.height) || 0,
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      const mimeRank = getCommonsImageMimeRank(left.mime) - getCommonsImageMimeRank(right.mime);
      if (mimeRank !== 0) {
        return mimeRank;
      }
      return (right.width || 0) - (left.width || 0);
    });

  return {
    query: normalizedQuery,
    results,
  };
}

async function listModels(options = {}) {
  const config = await getConfig();
  const baseUrl = normalizeBaseUrl(
    options.baseUrl
      || (options.useEmbeddingUrl ? (config.ollamaEmbeddingUrl || config.ollamaUrl) : config.ollamaUrl)
  );

  if (!baseUrl) {
    throw new Error("Ollama URL is not configured.");
  }

  const payload = await fetchJson(`${baseUrl}/api/tags`);
  const models = Array.isArray(payload.models)
    ? payload.models.map((model) => ({
        name: model.name,
        size: model.size,
        modifiedAt: model.modified_at,
        digest: model.digest,
      }))
    : [];
  const shouldReconcileSelected = options.reconcileSelected !== false && !options.useEmbeddingUrl && !options.baseUrl;
  const nextConfig = shouldReconcileSelected ? await reconcileSelectedModel(config, models) : config;

  return {
    baseUrl,
    config: nextConfig,
    models,
  };
}

function isBrowserTabCandidate(tab, excludedTabId) {
  if (!tab || !Number.isFinite(Number(tab.id))) {
    return false;
  }

  if (Number(tab.id) === Number(excludedTabId)) {
    return false;
  }

  return /^https?:\/\//i.test(String(tab.url || ""));
}

async function listBrowserTabs({ excludedTabId } = {}) {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  return tabs
    .filter((tab) => isBrowserTabCandidate(tab, excludedTabId))
    .map((tab) => ({
      id: Number(tab.id),
      title: String(tab.title || tab.url || "Untitled tab"),
      url: String(tab.url || ""),
      active: Boolean(tab.active),
    }));
}

function isHttpTabUrl(url) {
  return /^https?:\/\//i.test(String(url || ""));
}

async function injectContentScriptsIntoTab(tabId) {
  if (!chrome.scripting?.executeScript || !chrome.scripting?.insertCSS) {
    return;
  }

  await chrome.scripting.insertCSS({
    target: { tabId, allFrames: true },
    files: ["src/injected.css"],
  });
  await chrome.scripting.executeScript({
    target: { tabId, allFrames: true },
    files: ["src/content-script.js"],
  });
}

async function reinjectContentScriptsIntoOpenTabs() {
  if (!chrome.scripting?.executeScript || !chrome.scripting?.insertCSS) {
    return;
  }

  const tabs = await chrome.tabs.query({});
  const injectableTabIds = tabs
    .filter((tab) => Number.isFinite(Number(tab?.id)) && isHttpTabUrl(tab?.url))
    .map((tab) => Number(tab.id));

  await Promise.all(
    injectableTabIds.map(async (tabId) => {
      try {
        await injectContentScriptsIntoTab(tabId);
      } catch (error) {
        console.warn("[Edge AI Chat] Failed to re-inject content scripts", { tabId, error });
      }
    })
  );
}

async function openCopilotInTab(tabId) {
  if (!Number.isFinite(Number(tabId))) {
    throw new Error("Missing tab id for in-page copilot.");
  }

  try {
    return await chrome.tabs.sendMessage(Number(tabId), { type: "edge-ai-chat:toggle-panel", open: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/Receiving end does not exist|Could not establish connection/i.test(message)) {
      throw error;
    }
  }

  await injectContentScriptsIntoTab(Number(tabId));
  return chrome.tabs.sendMessage(Number(tabId), { type: "edge-ai-chat:toggle-panel", open: true });
}

async function ensureContextMenus() {
  if (!chrome.contextMenus?.create) {
    return;
  }

  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ANALYZE_IMAGE_ID,
    title: "用 Open Copilot 分析這張圖片",
    contexts: ["image"],
  });
  chrome.contextMenus.create({
    id: CONTEXT_MENU_PASTE_SELECTION_ID,
    title: "貼上選取文字到 Open Copilot",
    contexts: ["selection"],
  });
}

function getImageFilenameFromUrl(url, mimeType = "") {
  const normalizedUrl = String(url || "").trim();
  let pathname = "";
  if (normalizedUrl) {
    try {
      pathname = new URL(normalizedUrl).pathname;
    } catch (_error) {
      pathname = "";
    }
  }
  const rawName = pathname.split("/").pop() || "";
  if (rawName) {
    return rawName;
  }

  const subtype = String(mimeType || "").split("/")[1] || "png";
  return `context-image.${subtype}`;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

async function fetchImageAttachmentFromUrl(url) {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`Failed to fetch image (${response.status}).`);
  }

  const blob = await response.blob();
  const mimeType = blob.type || response.headers.get("content-type") || "image/png";
  const base64 = arrayBufferToBase64(await blob.arrayBuffer());

  return {
    name: getImageFilenameFromUrl(url, mimeType),
    mimeType,
    base64,
    sourceUrl: url,
  };
}

async function fetchBinaryAttachmentFromUrl(url) {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`Failed to fetch file (${response.status}).`);
  }

  const blob = await response.blob();
  const mimeType = blob.type || response.headers.get("content-type") || "application/octet-stream";
  const base64 = arrayBufferToBase64(await blob.arrayBuffer());

  return {
    mimeType,
    base64,
    sourceUrl: url,
  };
}

async function analyzeImageInTab(tabId, imageUrl) {
  if (!Number.isFinite(Number(tabId))) {
    throw new Error("Missing tab id for image analysis.");
  }
  if (!String(imageUrl || "").trim()) {
    throw new Error("Missing image URL.");
  }

  const image = await fetchImageAttachmentFromUrl(String(imageUrl));
  await openCopilotInTab(tabId);
  return chrome.tabs.sendMessage(Number(tabId), {
    type: "edge-ai-chat:analyze-image-context-menu",
    image,
  });
}

async function captureVisibleTabImage(windowId) {
  const dataUrl = await chrome.tabs.captureVisibleTab(windowId, { format: "png" });
  const normalized = String(dataUrl || "").trim();
  if (!normalized || !normalized.startsWith("data:image/")) {
    throw new Error("Failed to capture visible tab image.");
  }

  const commaIndex = normalized.indexOf(",");
  if (commaIndex < 0) {
    throw new Error("Captured image payload was invalid.");
  }

  const header = normalized.slice(0, commaIndex);
  const base64 = normalized.slice(commaIndex + 1).trim();
  const mimeMatch = header.match(/^data:(image\/[^;]+);base64$/i);
  return {
    name: `page-context-${Date.now()}.png`,
    mimeType: mimeMatch?.[1] || "image/png",
    base64,
  };
}

async function pasteSelectionIntoCopilot(tabId, selectionText) {
  if (!Number.isFinite(Number(tabId))) {
    throw new Error("Missing tab id for selection paste.");
  }
  if (!String(selectionText || "").trim()) {
    throw new Error("Missing selected text.");
  }

  await openCopilotInTab(tabId);
  return chrome.tabs.sendMessage(Number(tabId), {
    type: "edge-ai-chat:paste-selection-context-menu",
    selectionText: String(selectionText),
  });
}

async function getBrowserTabContexts({ tabIds = [], excludedTabId } = {}) {
  const ids = Array.from(
    new Set(
      (Array.isArray(tabIds) ? tabIds : [tabIds])
        .map((value) => Number.parseInt(String(value), 10))
        .filter((value) => Number.isFinite(value) && value > 0 && value !== Number(excludedTabId))
    )
  );

  const results = [];

  for (const tabId of ids) {
    let tab;
    try {
      tab = await chrome.tabs.get(tabId);
    } catch (_error) {
      continue;
    }

    if (!isBrowserTabCandidate(tab, excludedTabId)) {
      continue;
    }

    try {
      const response = await chrome.tabs.sendMessage(tabId, { type: "edge-ai-chat:get-page-context" });
      results.push({
        id: tabId,
        title: String(tab.title || response?.context?.title || tab.url || "Untitled tab"),
        url: String(tab.url || response?.context?.url || ""),
        context: response?.ok && response.context ? response.context : null,
        contextAvailable: Boolean(response?.ok && response.context),
      });
    } catch (_error) {
      results.push({
        id: tabId,
        title: String(tab.title || tab.url || "Untitled tab"),
        url: String(tab.url || ""),
        context: null,
        contextAvailable: false,
      });
    }
  }

  return results;
}

async function generateWithOllama(prompt, model) {
  const config = await getConfig();
  const baseUrl = normalizeBaseUrl(config.ollamaUrl);
  const selectedModel = model || config.selectedModel;

  if (!baseUrl) {
    throw new Error("Ollama URL is not configured.");
  }

  if (!selectedModel) {
    throw new Error("No Ollama model selected.");
  }

  const payload = await fetchJson(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: selectedModel,
      prompt,
      stream: false,
    }),
  });

  return {
    model: selectedModel,
    response: payload.response || "",
    done: payload.done,
  };
}

async function streamGenerateWithOllama(port, prompt, model) {
  const config = await getConfig();
  const baseUrl = normalizeBaseUrl(config.ollamaUrl);
  const selectedModel = model || config.selectedModel;

  if (!baseUrl) {
    throw new Error("Ollama URL is not configured.");
  }

  if (!selectedModel) {
    throw new Error("No Ollama model selected.");
  }

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: selectedModel,
      prompt,
      stream: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
  }

  if (!response.body) {
    throw new Error("Streaming response body is unavailable.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  if (!tryPostPortMessage(port, {
    type: "ollama:stream-start",
    model: selectedModel,
  })) {
    return;
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      const json = JSON.parse(trimmed);
      if (!tryPostPortMessage(port, {
        type: "ollama:stream-chunk",
        model: selectedModel,
        response: json.response || "",
        done: Boolean(json.done),
      })) {
        return;
      }
    }
  }

  const trailing = buffer.trim();
  if (trailing) {
    const json = JSON.parse(trailing);
    if (!tryPostPortMessage(port, {
      type: "ollama:stream-chunk",
      model: selectedModel,
      response: json.response || "",
      done: Boolean(json.done),
    })) {
      return;
    }
  }

  tryPostPortMessage(port, {
    type: "ollama:stream-complete",
    model: selectedModel,
  });
}

function shouldFallbackOllamaChatToGenerate(status) {
  return status === 403 || status === 404 || status === 405;
}

function buildOllamaGeneratePromptFromMessages(messages = []) {
  return (Array.isArray(messages) ? messages : [])
    .map((message) => {
      const role = String(message?.role || "user").trim().toLowerCase();
      const label = role === "system"
        ? "System"
        : role === "assistant"
          ? "Assistant"
          : "User";
      const content = String(message?.content || "").trim();
      return content ? `${label}:\n${content}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
}

function getOllamaGenerateImagesFromMessages(messages = []) {
  const userMessages = (Array.isArray(messages) ? messages : []).filter((message) => String(message?.role || "").trim().toLowerCase() === "user");
  for (let index = userMessages.length - 1; index >= 0; index -= 1) {
    const message = userMessages[index] || {};
    const images = Array.isArray(message?.images)
      ? message.images.filter((item) => typeof item === "string" && item.trim())
      : [];
    if (images.length) {
      return images;
    }
  }
  return [];
}

async function streamChatWithOllamaGenerateFallback(port, baseUrl, selectedModel, messages) {
  const prompt = buildOllamaGeneratePromptFromMessages(messages);
  if (!prompt) {
    throw new Error("Ollama fallback request has no prompt content.");
  }

  const images = getOllamaGenerateImagesFromMessages(messages);
  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: selectedModel,
      prompt,
      images,
      stream: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 403) {
      throw new Error(formatOllamaPostForbiddenError(response.status, text || response.statusText));
    }
    throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
  }

  if (!response.body) {
    throw new Error("Streaming response body is unavailable.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  if (!tryPostPortMessage(port, {
    type: "ollama:stream-start",
    model: selectedModel,
  })) {
    return;
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      const json = JSON.parse(trimmed);
      if (!tryPostPortMessage(port, {
        type: "ollama:stream-chunk",
        model: selectedModel,
        response: json.response || "",
        done: Boolean(json.done),
      })) {
        return;
      }
    }
  }

  const trailing = buffer.trim();
  if (trailing) {
    const json = JSON.parse(trailing);
    if (!tryPostPortMessage(port, {
      type: "ollama:stream-chunk",
      model: selectedModel,
      response: json.response || "",
      done: Boolean(json.done),
    })) {
      return;
    }
  }

  tryPostPortMessage(port, {
    type: "ollama:stream-complete",
    model: selectedModel,
  });
}

async function streamChatWithOllama(port, messages, model) {
  const config = await getConfig();
  const baseUrl = normalizeBaseUrl(config.ollamaUrl);
  const selectedModel = model || config.selectedModel;

  if (!baseUrl) {
    throw new Error("Ollama URL is not configured.");
  }

  if (!selectedModel) {
    throw new Error("No Ollama model selected.");
  }

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: selectedModel,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    if (shouldFallbackOllamaChatToGenerate(response.status)) {
      return streamChatWithOllamaGenerateFallback(port, baseUrl, selectedModel, messages);
    }
    if (response.status === 403) {
      throw new Error(formatOllamaPostForbiddenError(response.status, text || response.statusText));
    }
    throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
  }

  if (!response.body) {
    throw new Error("Streaming response body is unavailable.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  if (!tryPostPortMessage(port, {
    type: "ollama:stream-start",
    model: selectedModel,
  })) {
    return;
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      const json = JSON.parse(trimmed);
      if (!tryPostPortMessage(port, {
        type: "ollama:stream-chunk",
        model: selectedModel,
        response: json.message?.content || "",
        done: Boolean(json.done),
      })) {
        return;
      }
    }
  }

  const trailing = buffer.trim();
  if (trailing) {
    const json = JSON.parse(trailing);
    if (!tryPostPortMessage(port, {
      type: "ollama:stream-chunk",
      model: selectedModel,
      response: json.message?.content || "",
      done: Boolean(json.done),
    })) {
      return;
    }
  }

  tryPostPortMessage(port, {
    type: "ollama:stream-complete",
    model: selectedModel,
  });
}

function getDefaultProvider(config = {}) {
  return String(config?.defaultProvider || "ollama").trim() || "ollama";
}

function getConfiguredProviderModel(config = {}, overrideModel = "") {
  const provider = getDefaultProvider(config);
  const explicitModel = String(overrideModel || "").trim();
  if (explicitModel) {
    return explicitModel;
  }
  if (provider === "lmStudio") {
    return String(config?.lmStudioModel || "").trim();
  }
  if (provider === "gemini") {
    return String(config?.geminiModel || "").trim();
  }
  if (provider === "azureOpenAi") {
    return String(config?.azureOpenAiDeployment || "").trim();
  }
  return String(config?.selectedModel || "").trim();
}

function extractGeminiTextFromResponse(payload = {}) {
  return (Array.isArray(payload?.candidates) ? payload.candidates : [])
    .flatMap((candidate) => Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [])
    .map((part) => String(part?.text || ""))
    .filter(Boolean)
    .join("");
}

function buildGeminiPartsFromMessage(message = {}) {
  const parts = [];
  const text = String(message?.content || "").trim();
  if (text) {
    parts.push({ text });
  }

  const imageAttachments = Array.isArray(message?.imageAttachments) ? message.imageAttachments : [];
  if (imageAttachments.length) {
    imageAttachments.forEach((item) => {
      const data = String(item?.base64 || "").trim();
      if (!data) {
        return;
      }
      parts.push({
        inline_data: {
          mime_type: String(item?.mimeType || "image/png").trim() || "image/png",
          data,
        },
      });
    });
  } else if (Array.isArray(message?.images)) {
    message.images.forEach((data) => {
      const normalized = String(data || "").trim();
      if (!normalized) {
        return;
      }
      parts.push({
        inline_data: {
          mime_type: "image/png",
          data: normalized,
        },
      });
    });
  }

  return parts;
}

function convertMessagesToGeminiPayload(messages = []) {
  const normalizedMessages = Array.isArray(messages) ? messages : [];
  const systemParts = [];
  const contents = [];

  normalizedMessages.forEach((message) => {
    const role = String(message?.role || "").trim().toLowerCase();
    const parts = buildGeminiPartsFromMessage(message);
    if (!parts.length) {
      return;
    }

    if (role === "system") {
      systemParts.push(...parts);
      return;
    }

    contents.push({
      role: role === "assistant" ? "model" : "user",
      parts,
    });
  });

  return {
    systemInstruction: systemParts.length ? { parts: systemParts } : undefined,
    contents,
  };
}

function buildGeminiRequestUrl(model, { stream = false } = {}) {
  const action = stream ? "streamGenerateContent?alt=sse" : "generateContent";
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:${action}`;
}

function buildOpenAiCompatibleHeaders(apiKey = "") {
  const normalizedApiKey = String(apiKey || "").trim();
  return {
    "Content-Type": "application/json",
    ...(normalizedApiKey ? { Authorization: `Bearer ${normalizedApiKey}` } : {}),
  };
}

function buildLmStudioBaseUrl(config = {}) {
  const baseUrl = normalizeBaseUrl(config?.lmStudioUrl);
  if (!baseUrl) {
    throw new Error("LM Studio URL is not configured.");
  }
  return baseUrl;
}

function buildLmStudioChatCompletionsUrl(config = {}) {
  return `${buildLmStudioBaseUrl(config)}/v1/chat/completions`;
}

function buildLmStudioModelsUrl(config = {}) {
  return `${buildLmStudioBaseUrl(config)}/v1/models`;
}

function normalizeAzureOpenAiEndpoint(endpoint) {
  return normalizeBaseUrl(endpoint).replace(/\/openai$/i, "");
}

function buildAzureOpenAiChatCompletionsUrl(config = {}, deployment = "") {
  const endpoint = normalizeAzureOpenAiEndpoint(config?.azureOpenAiEndpoint);
  const selectedDeployment = String(deployment || config?.azureOpenAiDeployment || "").trim();
  const apiVersion = String(config?.azureOpenAiApiVersion || "").trim();

  if (!endpoint) {
    throw new Error("Azure OpenAI endpoint is not configured.");
  }
  if (!selectedDeployment) {
    throw new Error("Azure OpenAI deployment is not configured.");
  }
  if (!apiVersion) {
    throw new Error("Azure OpenAI API version is not configured.");
  }

  return `${endpoint}/openai/deployments/${encodeURIComponent(selectedDeployment)}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;
}

function extractTextFromOpenAiContentParts(content) {
  if (typeof content === "string") {
    return content;
  }
  if (!Array.isArray(content)) {
    return "";
  }
  return content
    .map((part) => {
      if (typeof part === "string") {
        return part;
      }
      return String(part?.text || part?.content || "");
    })
    .filter(Boolean)
    .join("");
}

function extractAzureOpenAiTextFromResponse(payload = {}) {
  return (Array.isArray(payload?.choices) ? payload.choices : [])
    .map((choice) => extractTextFromOpenAiContentParts(choice?.message?.content))
    .filter(Boolean)
    .join("");
}

function extractAzureOpenAiTextDeltaFromChunk(payload = {}) {
  return (Array.isArray(payload?.choices) ? payload.choices : [])
    .map((choice) => extractTextFromOpenAiContentParts(choice?.delta?.content))
    .filter(Boolean)
    .join("");
}

function buildAzureOpenAiMessageContent(message = {}) {
  const text = String(message?.content || "").trim();
  const imageAttachments = Array.isArray(message?.imageAttachments) ? message.imageAttachments : [];
  const fallbackImages = Array.isArray(message?.images) ? message.images : [];

  if (!imageAttachments.length && !fallbackImages.length) {
    return text;
  }

  const content = [];
  if (text) {
    content.push({
      type: "text",
      text,
    });
  }

  if (imageAttachments.length) {
    imageAttachments.forEach((item) => {
      const data = String(item?.base64 || "").trim();
      if (!data) {
        return;
      }
      const mimeType = String(item?.mimeType || "image/png").trim() || "image/png";
      content.push({
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${data}`,
        },
      });
    });
  } else {
    fallbackImages.forEach((data) => {
      const normalized = String(data || "").trim();
      if (!normalized) {
        return;
      }
      content.push({
        type: "image_url",
        image_url: {
          url: `data:image/png;base64,${normalized}`,
        },
      });
    });
  }

  return content;
}

function convertMessagesToAzureOpenAiPayload(messages = []) {
  return (Array.isArray(messages) ? messages : [])
    .map((message) => {
      const role = String(message?.role || "user").trim().toLowerCase();
      const content = buildAzureOpenAiMessageContent(message);
      const normalizedRole = role === "assistant" || role === "system" ? role : "user";
      const hasContent = typeof content === "string"
        ? Boolean(content)
        : Array.isArray(content) && content.length > 0;
      if (!hasContent) {
        return null;
      }
      return {
        role: normalizedRole,
        content,
      };
    })
    .filter(Boolean);
}

function extractOpenAiCompatibleModelNames(payload = {}) {
  return (Array.isArray(payload?.data) ? payload.data : [])
    .map((item) => ({
      name: String(item?.id || item?.name || "").trim(),
      size: Number(item?.size || 0) || 0,
    }))
    .filter((item) => item.name);
}

async function generateWithGemini(prompt, model) {
  const config = await getConfig();
  const selectedModel = getConfiguredProviderModel(config, model);
  const apiKey = String(config?.geminiApiKey || "").trim();

  if (!selectedModel) {
    throw new Error("No Gemini model configured.");
  }
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  const payload = await fetchJson(buildGeminiRequestUrl(selectedModel), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: String(prompt || "") }],
        },
      ],
    }),
  });

  return {
    model: selectedModel,
    response: extractGeminiTextFromResponse(payload),
    done: true,
  };
}

async function listLmStudioModels() {
  const config = await getConfig();
  const baseUrl = buildLmStudioBaseUrl(config);
  const payload = await fetchJson(buildLmStudioModelsUrl(config), {
    headers: buildOpenAiCompatibleHeaders(config?.lmStudioApiKey),
  });

  return {
    baseUrl,
    models: extractOpenAiCompatibleModelNames(payload),
    config,
  };
}

async function generateWithLmStudio(prompt, model) {
  const config = await getConfig();
  const selectedModel = getConfiguredProviderModel(config, model);

  if (!selectedModel) {
    throw new Error("No LM Studio model configured.");
  }

  const payload = await fetchJson(buildLmStudioChatCompletionsUrl(config), {
    method: "POST",
    headers: buildOpenAiCompatibleHeaders(config?.lmStudioApiKey),
    body: JSON.stringify({
      model: selectedModel,
      messages: [
        {
          role: "user",
          content: String(prompt || ""),
        },
      ],
      stream: false,
    }),
  });

  return {
    model: selectedModel,
    response: extractAzureOpenAiTextFromResponse(payload),
    done: true,
  };
}

async function generateWithAzureOpenAi(prompt, model) {
  const config = await getConfig();
  const selectedModel = getConfiguredProviderModel(config, model);
  const apiKey = String(config?.azureOpenAiApiKey || "").trim();

  if (!selectedModel) {
    throw new Error("No Azure OpenAI deployment configured.");
  }
  if (!apiKey) {
    throw new Error("Azure OpenAI API key is not configured.");
  }

  const payload = await fetchJson(buildAzureOpenAiChatCompletionsUrl(config, selectedModel), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: String(prompt || ""),
        },
      ],
      stream: false,
    }),
  });

  return {
    model: selectedModel,
    response: extractAzureOpenAiTextFromResponse(payload),
    done: true,
  };
}

async function streamChatWithGemini(port, messages, model) {
  const config = await getConfig();
  const selectedModel = getConfiguredProviderModel(config, model);
  const apiKey = String(config?.geminiApiKey || "").trim();

  if (!selectedModel) {
    throw new Error("No Gemini model configured.");
  }
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  const geminiPayload = convertMessagesToGeminiPayload(messages);
  if (!Array.isArray(geminiPayload.contents) || !geminiPayload.contents.length) {
    throw new Error("Gemini request has no content.");
  }

  const response = await fetch(buildGeminiRequestUrl(selectedModel, { stream: true }), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(geminiPayload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
  }

  if (!response.body) {
    throw new Error("Streaming response body is unavailable.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  if (!tryPostPortMessage(port, {
    type: "ollama:stream-start",
    model: selectedModel,
  })) {
    return;
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const rawEvent of events) {
      const dataLines = rawEvent
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .filter(Boolean);

      if (!dataLines.length) {
        continue;
      }

      const chunkText = dataLines
        .map((line) => extractGeminiTextFromResponse(JSON.parse(line)))
        .join("");

      if (!chunkText) {
        continue;
      }

      if (!tryPostPortMessage(port, {
        type: "ollama:stream-chunk",
        model: selectedModel,
        response: chunkText,
        done: false,
      })) {
        return;
      }
    }
  }

  const trailingEvent = buffer.trim();
  if (trailingEvent) {
    const dataLines = trailingEvent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .filter(Boolean);

    const trailingText = dataLines
      .map((line) => extractGeminiTextFromResponse(JSON.parse(line)))
      .join("");

    if (trailingText) {
      if (!tryPostPortMessage(port, {
        type: "ollama:stream-chunk",
        model: selectedModel,
        response: trailingText,
        done: false,
      })) {
        return;
      }
    }
  }

  tryPostPortMessage(port, {
    type: "ollama:stream-complete",
    model: selectedModel,
  });
}

async function streamChatWithLmStudio(port, messages, model) {
  const config = await getConfig();
  const selectedModel = getConfiguredProviderModel(config, model);

  if (!selectedModel) {
    throw new Error("No LM Studio model configured.");
  }

  const lmStudioMessages = convertMessagesToAzureOpenAiPayload(messages);
  if (!lmStudioMessages.length) {
    throw new Error("LM Studio request has no messages.");
  }

  const response = await fetch(buildLmStudioChatCompletionsUrl(config), {
    method: "POST",
    headers: buildOpenAiCompatibleHeaders(config?.lmStudioApiKey),
    body: JSON.stringify({
      model: selectedModel,
      messages: lmStudioMessages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(formatHttpError(response.status, text || response.statusText));
  }

  if (!response.body) {
    throw new Error("Streaming response body is unavailable.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  if (!tryPostPortMessage(port, {
    type: "ollama:stream-start",
    model: selectedModel,
  })) {
    return;
  }

  const emitLmStudioChunk = (eventText) => {
    const dataLines = String(eventText || "")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .filter(Boolean);

    for (const line of dataLines) {
      if (line === "[DONE]") {
        return "done";
      }

      const chunkText = extractAzureOpenAiTextDeltaFromChunk(JSON.parse(line));
      if (!chunkText) {
        continue;
      }

      if (!tryPostPortMessage(port, {
        type: "ollama:stream-chunk",
        model: selectedModel,
        response: chunkText,
        done: false,
      })) {
        return "disconnected";
      }
    }

    return "continue";
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const rawEvent of events) {
      const state = emitLmStudioChunk(rawEvent);
      if (state === "done") {
        tryPostPortMessage(port, {
          type: "ollama:stream-complete",
          model: selectedModel,
        });
        return;
      }
      if (state === "disconnected") {
        return;
      }
    }
  }

  const trailingEvent = buffer.trim();
  if (trailingEvent) {
    const state = emitLmStudioChunk(trailingEvent);
    if (state === "disconnected") {
      return;
    }
  }

  tryPostPortMessage(port, {
    type: "ollama:stream-complete",
    model: selectedModel,
  });
}

async function streamChatWithAzureOpenAi(port, messages, model) {
  const config = await getConfig();
  const selectedModel = getConfiguredProviderModel(config, model);
  const apiKey = String(config?.azureOpenAiApiKey || "").trim();

  if (!selectedModel) {
    throw new Error("No Azure OpenAI deployment configured.");
  }
  if (!apiKey) {
    throw new Error("Azure OpenAI API key is not configured.");
  }

  const azureMessages = convertMessagesToAzureOpenAiPayload(messages);
  if (!azureMessages.length) {
    throw new Error("Azure OpenAI request has no messages.");
  }

  const response = await fetch(buildAzureOpenAiChatCompletionsUrl(config, selectedModel), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      messages: azureMessages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(formatHttpError(response.status, text || response.statusText));
  }

  if (!response.body) {
    throw new Error("Streaming response body is unavailable.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  if (!tryPostPortMessage(port, {
    type: "ollama:stream-start",
    model: selectedModel,
  })) {
    return;
  }

  const emitAzureChunk = (eventText) => {
    const dataLines = String(eventText || "")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .filter(Boolean);

    for (const line of dataLines) {
      if (line === "[DONE]") {
        return "done";
      }

      const chunkText = extractAzureOpenAiTextDeltaFromChunk(JSON.parse(line));
      if (!chunkText) {
        continue;
      }

      if (!tryPostPortMessage(port, {
        type: "ollama:stream-chunk",
        model: selectedModel,
        response: chunkText,
        done: false,
      })) {
        return "disconnected";
      }
    }

    return "continue";
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const rawEvent of events) {
      const state = emitAzureChunk(rawEvent);
      if (state === "done") {
        tryPostPortMessage(port, {
          type: "ollama:stream-complete",
          model: selectedModel,
        });
        return;
      }
      if (state === "disconnected") {
        return;
      }
    }
  }

  const trailingEvent = buffer.trim();
  if (trailingEvent) {
    const state = emitAzureChunk(trailingEvent);
    if (state === "disconnected") {
      return;
    }
  }

  tryPostPortMessage(port, {
    type: "ollama:stream-complete",
    model: selectedModel,
  });
}

async function testProviderConnection(providerOverride = "") {
  const config = await getConfig();
  const provider = String(providerOverride || getDefaultProvider(config) || "ollama").trim();

  if (provider === "ollama") {
    const result = await listModels();
    return {
      provider,
      baseUrl: result.baseUrl,
      modelCount: result.models.length,
      message: `Connected to ${result.baseUrl}. Found ${result.models.length} model(s).`,
    };
  }

  if (provider === "lmStudio") {
    const result = await listLmStudioModels();
    return {
      provider,
      baseUrl: result.baseUrl,
      modelCount: result.models.length,
      message: `Connected to ${result.baseUrl}. Found ${result.models.length} model(s).`,
    };
  }

  if (provider === "gemini") {
    const result = await generateWithGemini("Reply with OK.", "");
    return {
      provider,
      model: result.model,
      message: `Connected to Gemini with model ${result.model}.`,
    };
  }

  if (provider === "azureOpenAi") {
    const result = await generateWithAzureOpenAi("Reply with OK.", "");
    return {
      provider,
      model: result.model,
      message: `Connected to Azure OpenAI with deployment ${result.model}.`,
    };
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

async function generateWithConfiguredProvider(prompt, model) {
  const config = await getConfig();
  const provider = getDefaultProvider(config);

  if (provider === "lmStudio") {
    return generateWithLmStudio(prompt, model);
  }

  if (provider === "gemini") {
    return generateWithGemini(prompt, model);
  }

  if (provider === "azureOpenAi") {
    return generateWithAzureOpenAi(prompt, model);
  }

  return generateWithOllama(prompt, model);
}

async function streamChatWithConfiguredProvider(port, messages, model) {
  const config = await getConfig();
  const provider = getDefaultProvider(config);

  if (provider === "lmStudio") {
    return streamChatWithLmStudio(port, messages, model);
  }

  if (provider === "gemini") {
    return streamChatWithGemini(port, messages, model);
  }

  if (provider === "azureOpenAi") {
    return streamChatWithAzureOpenAi(port, messages, model);
  }

  return streamChatWithOllama(port, messages, model);
}

chrome.runtime.onInstalled.addListener(async () => {
  await ensureSecretConfigMigrated();
  const config = await getConfig();
  await chrome.storage.sync.set(omitSecretConfig(config));
  await restoreTaskAlarms();
  await restoreWatchtowerAlarms();
  await ensureContextMenus();
  await reinjectContentScriptsIntoOpenTabs();
});

chrome.runtime.onStartup?.addListener(() => {
  ensureSecretConfigMigrated().catch((error) => {
    console.warn("[Edge AI Chat] Failed to migrate secret config on startup", error);
  });
  restoreTaskAlarms().catch((error) => {
    console.warn("[Edge AI Chat] Failed to restore task alarms on startup", error);
  });
  restoreWatchtowerAlarms().catch((error) => {
    console.warn("[Edge AI Chat] Failed to restore Watchtower alarms on startup", error);
  });
  ensureContextMenus().catch((error) => {
    console.warn("[Edge AI Chat] Failed to restore context menus on startup", error);
  });
  reinjectContentScriptsIntoOpenTabs().catch((error) => {
    console.warn("[Edge AI Chat] Failed to re-inject content scripts on startup", error);
  });
});

chrome.commands?.onCommand.addListener(async (command) => {
  if (command !== "open-in-page-copilot") {
    return;
  }

  try {
    const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!activeTab?.id || !isHttpTabUrl(activeTab.url)) {
      return;
    }
    await openCopilotInTab(activeTab.id);
  } catch (error) {
    console.warn("[Edge AI Chat] Failed to open in-page copilot from command", error);
  }
});

chrome.contextMenus?.onClicked.addListener((info, tab) => {
  if (!tab?.id || !isHttpTabUrl(tab.url)) {
    return;
  }

  if (info.menuItemId === CONTEXT_MENU_ANALYZE_IMAGE_ID && info.srcUrl) {
    analyzeImageInTab(tab.id, info.srcUrl).catch((error) => {
      console.warn("[Edge AI Chat] Failed to analyze image from context menu", error);
    });
    return;
  }

  if (info.menuItemId === CONTEXT_MENU_PASTE_SELECTION_ID && info.selectionText) {
    pasteSelectionIntoCopilot(tab.id, info.selectionText).catch((error) => {
      console.warn("[Edge AI Chat] Failed to paste selection from context menu", error);
    });
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  const watchtowerId = getWatchtowerIdFromAlarmName(alarm?.name || "");
  if (watchtowerId) {
    runWatchtowerCheck(watchtowerId).catch((error) => {
      console.warn("[Edge AI Chat] Watchtower check failed", error);
    });
    return;
  }

  const taskId = getTaskIdFromAlarmName(alarm?.name || "");
  if (!taskId) {
    return;
  }

  (async () => {
    const tasks = await getTaskRecords();
    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.status === "completed" || !task.reminderAt) {
      return;
    }

    await chrome.notifications.create(buildTaskNotificationId(taskId), {
      type: "basic",
      iconUrl: "assets/icons/icon-128.png",
      title: task.title,
      message: buildTaskNotificationMessage(task),
      priority: 2,
    });

    try {
      await notifyTelegramTaskReminder(task);
    } catch (error) {
      console.warn("[Edge AI Chat] Failed to deliver Telegram task reminder", error);
    }
    try {
      await notifyLineTaskReminder(task);
    } catch (error) {
      console.warn("[Edge AI Chat] Failed to deliver LINE task reminder", error);
    }
    try {
      await notifyTeamsTaskReminder(task);
    } catch (error) {
      console.warn("[Edge AI Chat] Failed to deliver Teams task reminder", error);
    }
    try {
      await notifySlackTaskReminder(task);
    } catch (error) {
      console.warn("[Edge AI Chat] Failed to deliver Slack task reminder", error);
    }
    try {
      await notifyDiscordTaskReminder(task);
    } catch (error) {
      console.warn("[Edge AI Chat] Failed to deliver Discord task reminder", error);
    }

    const nextTasks = tasks.map((item) => (item.id === taskId ? { ...item, reminderSentAt: new Date().toISOString() } : item));
    await saveTaskRecords(nextTasks);
  })().catch((error) => {
    console.warn("[Edge AI Chat] Failed to deliver task reminder", error);
  });
});

chrome.notifications.onClicked.addListener((notificationId) => {
  const watchtowerId = getWatchtowerIdFromNotificationId(notificationId);
  if (watchtowerId) {
    (async () => {
      const monitors = await getWatchtowerMonitors();
      const monitor = monitors.find((item) => item.id === watchtowerId);
      if (monitor?.url) {
        await chrome.tabs.create({ url: monitor.url });
      }
      await chrome.notifications.clear(notificationId);
    })().catch((error) => {
      console.warn("[Edge AI Chat] Failed to open Watchtower source", error);
    });
    return;
  }

  const taskId = getTaskIdFromNotificationId(notificationId);
  if (!taskId) {
    return;
  }

  (async () => {
    const tasks = await getTaskRecords();
    const task = tasks.find((item) => item.id === taskId);
    if (task?.sourceUrl) {
      await chrome.tabs.create({ url: task.sourceUrl });
    }
    await chrome.notifications.clear(notificationId);
  })().catch((error) => {
    console.warn("[Edge AI Chat] Failed to open task source", error);
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    switch (message?.type) {
      case "ollama:get-config": {
        const config = await getConfig();
        sendResponse({ ok: true, config: sanitizeConfigForSender(config, sender) });
        return;
      }
      case "ollama:set-config": {
        const config = await setConfig(message.config || {});
        sendResponse({ ok: true, config: sanitizeConfigForSender(config, sender) });
        return;
      }
      case "ollama:list-models": {
        const result = await listModels({
          baseUrl: message.baseUrl || "",
          useEmbeddingUrl: Boolean(message.useEmbeddingUrl),
          reconcileSelected: message.reconcileSelected,
        });
        sendResponse({
          ok: true,
          ...result,
          config: result.config ? sanitizeConfigForSender(result.config, sender) : result.config,
        });
        return;
      }
      case "provider:test-connection": {
        sendResponse({ ok: true, ...(await testProviderConnection(message.provider || "")) });
        return;
      }
      case "ollama:select-model": {
        const config = await setConfig({ selectedModel: message.model || "" });
        sendResponse({ ok: true, config: sanitizeConfigForSender(config, sender) });
        return;
      }
      case "ollama:generate": {
        sendResponse({ ok: true, ...(await generateWithConfiguredProvider(message.prompt || "", message.model)) });
        return;
      }
      case "browser:list-tabs": {
        sendResponse({ ok: true, tabs: await listBrowserTabs({ excludedTabId: sender?.tab?.id }) });
        return;
      }
      case "browser:get-tab-contexts": {
        sendResponse({ ok: true, tabs: await getBrowserTabContexts({ tabIds: message.tabIds || [], excludedTabId: sender?.tab?.id }) });
        return;
      }
      case "browser:capture-visible-tab-image": {
        sendResponse({ ok: true, image: await captureVisibleTabImage(sender?.tab?.windowId) });
        return;
      }
      case "browser:get-current-tab-info": {
        sendResponse({
          ok: true,
          tab: sender?.tab
            ? {
                id: sender.tab.id,
                title: String(sender.tab.title || ""),
                url: String(sender.tab.url || ""),
              }
            : null,
        });
        return;
      }
      case "browser:fetch-binary-url": {
        sendResponse({ ok: true, file: await fetchBinaryAttachmentFromUrl(String(message.url || "")) });
        return;
      }
      case "landing-page:get-url-context": {
        sendResponse({ ok: true, context: await getPageContextFromUrl(String(message.url || "")) });
        return;
      }
      case "web:search": {
        sendResponse({ ok: true, ...(await searchWebResults(message || {})) });
        return;
      }
      case "ollama:open-in-page-copilot": {
        const tabId = sender?.tab?.id ?? message.tabId;
        sendResponse({ ok: true, ...(await openCopilotInTab(tabId)) });
        return;
      }
      case "commons:search-image": {
        sendResponse({ ok: true, ...(await searchCommonsImages(message || {})) });
        return;
      }
      case "ollama:open-options": {
        await chrome.runtime.openOptionsPage();
        sendResponse({ ok: true });
        return;
      }
      case "investment-proposal:open-builder": {
        sendResponse(await openInvestmentProposalBuilderWindow());
        return;
      }
      case "ollama:set-work-folder": {
        await setWorkFolderHandle(message.handle);
        sendResponse({ ok: true, status: await getWorkFolderStatus() });
        return;
      }
      case "ollama:clear-work-folder": {
        await clearWorkFolderHandle();
        sendResponse({ ok: true, status: await getWorkFolderStatus() });
        return;
      }
      case "ollama:get-work-folder-status": {
        sendResponse({ ok: true, status: await getWorkFolderStatus() });
        return;
      }
      case "batch-url-qa:list-jobs": {
        sendResponse({ ok: true, jobs: await getBatchUrlQaJobs(), status: await getWorkFolderStatus() });
        return;
      }
      case "batch-url-qa:start-job": {
        sendResponse({ ok: true, job: await startBatchUrlQaJob(message || {}), status: await getWorkFolderStatus() });
        return;
      }
      case "batch-url-qa:cancel-job": {
        sendResponse({ ok: true, job: await cancelBatchUrlQaJob(String(message.jobId || "").trim()), status: await getWorkFolderStatus() });
        return;
      }
      case "work-folder:sync-push": {
        sendResponse({ ok: true, result: await pushWorkFolderSync(), status: await getWorkFolderStatus() });
        return;
      }
      case "work-folder:sync-pull": {
        sendResponse({ ok: true, result: await pullWorkFolderSync(), status: await getWorkFolderStatus() });
        return;
      }
      case "work-folder:write-json": {
        sendResponse({ ok: true, file: await writeNamedWorkFolderJson(message || {}), status: await getWorkFolderStatus() });
        return;
      }
      case "work-folder:read-json": {
        sendResponse({ ok: true, file: await readNamedWorkFolderJson(message || {}), status: await getWorkFolderStatus() });
        return;
      }
      case "work-folder:begin-write-json-session": {
        sendResponse({ ok: true, session: await beginWorkFolderJsonWriteSession(message || {}), status: await getWorkFolderStatus() });
        return;
      }
      case "work-folder:append-write-json-session": {
        sendResponse({ ok: true, session: await appendWorkFolderJsonWriteSession(message || {}), status: await getWorkFolderStatus() });
        return;
      }
      case "work-folder:finish-write-json-session": {
        sendResponse({ ok: true, session: await finishWorkFolderJsonWriteSession(message || {}), status: await getWorkFolderStatus() });
        return;
      }
      case "work-folder:begin-read-json-session": {
        sendResponse({ ok: true, session: await beginWorkFolderJsonReadSession(message || {}), status: await getWorkFolderStatus() });
        return;
      }
      case "work-folder:read-json-session-chunk": {
        sendResponse({ ok: true, session: await readWorkFolderJsonReadSessionChunk(message || {}), status: await getWorkFolderStatus() });
        return;
      }
      case "work-folder:finish-read-json-session": {
        sendResponse({ ok: true, session: await finishWorkFolderJsonReadSession(message || {}), status: await getWorkFolderStatus() });
        return;
      }
      case "google-drive:get-status": {
        sendResponse({ ok: true, status: await getGoogleDriveSyncStatus() });
        return;
      }
      case "google-drive:connect": {
        await authorizeGoogleDrive(true);
        sendResponse({ ok: true, status: await getGoogleDriveSyncStatus() });
        return;
      }
      case "google-drive:disconnect": {
        await clearGoogleDriveSyncAuth();
        sendResponse({ ok: true, status: await getGoogleDriveSyncStatus() });
        return;
      }
      case "google-drive:sync-push": {
        const result = await syncGoogleDriveNow("push", true);
        sendResponse({ ok: true, result, status: await getGoogleDriveSyncStatus() });
        return;
      }
      case "google-drive:sync-pull": {
        const result = await syncGoogleDriveNow("pull", true);
        sendResponse({ ok: true, result, status: await getGoogleDriveSyncStatus() });
        return;
      }
      case "ollama:save-chat-session": {
        sendResponse({ ok: true, result: await saveChatSession(message.session || {}) });
        return;
      }
      case "ollama:get-latest-chat-session": {
        sendResponse({ ok: true, session: await getLatestChatSession() });
        return;
      }
      case "telegram:notify-agent-flow-complete": {
        sendResponse({ ok: true, ...(await notifyTelegramAgentFlowComplete(message.payload || {})) });
        return;
      }
      case "telegram:test-notification": {
        sendResponse(await testTelegramNotification());
        return;
      }
      case "line:notify-agent-flow-complete": {
        sendResponse({ ok: true, ...(await notifyLineAgentFlowComplete(message.payload || {})) });
        return;
      }
      case "line:test-notification": {
        sendResponse(await testLineNotification());
        return;
      }
      case "teams:notify-agent-flow-complete": {
        sendResponse({ ok: true, ...(await notifyTeamsAgentFlowComplete(message.payload || {})) });
        return;
      }
      case "teams:test-notification": {
        sendResponse(await testTeamsNotification());
        return;
      }
      case "slack:notify-agent-flow-complete": {
        sendResponse({ ok: true, ...(await notifySlackAgentFlowComplete(message.payload || {})) });
        return;
      }
      case "slack:test-notification": {
        sendResponse(await testSlackNotification());
        return;
      }
      case "discord:notify-agent-flow-complete": {
        sendResponse({ ok: true, ...(await notifyDiscordAgentFlowComplete(message.payload || {})) });
        return;
      }
      case "discord:test-notification": {
        sendResponse(await testDiscordNotification());
        return;
      }
      case "task:list": {
        sendResponse({ ok: true, tasks: await getTaskRecords() });
        return;
      }
      case "task:save": {
        sendResponse({ ok: true, ...(await upsertTaskRecord(message.task || {})) });
        return;
      }
      case "task:delete": {
        sendResponse({ ok: true, ...(await deleteTaskRecord(message.taskId || "")) });
        return;
      }
      case "watchtower:list": {
        sendResponse({ ok: true, ...(await getWatchtowerState()) });
        return;
      }
      case "watchtower:save": {
        sendResponse({ ok: true, ...(await upsertWatchtowerMonitor(message.monitor || {})) });
        return;
      }
      case "watchtower:set-enabled": {
        sendResponse({ ok: true, ...(await setWatchtowerMonitorEnabled(message.monitorId || "", message.enabled === true)) });
        return;
      }
      case "watchtower:check-now": {
        const check = await runWatchtowerCheck(message.monitorId || "", { force: true });
        sendResponse({ ok: true, check, ...(await getWatchtowerState()) });
        return;
      }
      case "watchtower:delete": {
        sendResponse({ ok: true, ...(await deleteWatchtowerMonitor(message.monitorId || "")) });
        return;
      }
      case "ollama:list-local-work-folder-directory": {
        sendResponse({ ok: true, directory: await listLocalWorkFolderDirectory(message || {}) });
        return;
      }
      case "ollama:read-local-work-folder-file": {
        sendResponse({ ok: true, file: await readLocalWorkFolderFile(message || {}) });
        return;
      }
      case "github:fetch-file": {
        sendResponse({ ok: true, file: await fetchGithubFile(message || {}) });
        return;
      }
      case "github:list-directory": {
        sendResponse({ ok: true, directory: await listGithubDirectory(message || {}) });
        return;
      }
      case "github:fetch-readme": {
        sendResponse({ ok: true, readme: await fetchGithubReadme(message || {}) });
        return;
      }
      case "github:list-repositories": {
        const result = await listGithubRepositories(message || {});
        const config = await getConfig();
        const scopeWarning = buildGithubTokenScopeWarning(config.githubApiKey);
        sendResponse({
          ok: true,
          ...result,
          warnings: scopeWarning ? [...(Array.isArray(result.warnings) ? result.warnings : []), scopeWarning] : result.warnings,
        });
        return;
      }
      case "github:fetch-repository": {
        sendResponse({ ok: true, repository: await fetchGithubRepository(message || {}) });
        return;
      }
      default: {
        sendResponse({ ok: false, error: "Unknown message type." });
      }
    }
  })().catch((error) => {
    sendResponse({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  });

  return true;
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "ollama-stream") {
    return;
  }

  port.onMessage.addListener((message) => {
    if (message?.type === "ollama:stream-generate") {
      streamGenerateWithOllama(port, message.prompt || "", message.model)
        .catch((error) => {
          tryPostPortMessage(port, {
            type: "ollama:stream-error",
            error: error instanceof Error ? error.message : String(error),
          });
        });
      return;
    }

    if (message?.type === "ollama:stream-chat") {
      streamChatWithConfiguredProvider(port, message.messages || [], message.model)
        .catch((error) => {
          tryPostPortMessage(port, {
            type: "ollama:stream-error",
            error: error instanceof Error ? error.message : String(error),
          });
        });
    }
  });
});
