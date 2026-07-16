const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const sourcePath = path.join(__dirname, "..", "src", "content-script.js");
const source = fs.readFileSync(sourcePath, "utf8");

function sourceBetween(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.ok(start >= 0, `Missing source marker: ${startMarker}`);
  assert.ok(end > start, `Missing source marker: ${endMarker}`);
  return source.slice(start, end);
}

const context = {
  chatMessages: [],
  console,
  extractMarkdownCodeBlocks: () => [],
  getSavedCustomStarterIds: () => new Set(),
  getStarterDraftsForCodeBlock: () => [],
  normalizeStarterSearchText: (value) => String(value || "").toLowerCase().replace(/\s+/g, " ").trim(),
  tl: (key, vars = {}) => ({
    messageFollowupTitle: "下一步建議",
    messageFollowupHint: "點選一項，直接作為下一題送出",
    evidenceJumpToSource: "跳到原文",
    evidenceTitle: "頁面證據",
    evidenceVerifiedSummary: "已驗證 {verified}/{total}",
    evidenceVerified: "已在來源快照驗證",
    evidenceUnverified: "無法在來源快照驗證",
    evidenceMissing: "沒有可驗證引文",
    evidenceSourceCurrentPage: "目前頁面",
    copyCode: "Copy code",
  }[key] || key).replace(/\{(\w+)\}/g, (_match, name) => String(vars[name] ?? "")),
};
vm.createContext(context);

const displayNormalizer = sourceBetween("function escapeHtml(value)", "function normalizeMarkdownLinkTarget(target)");
const markdownRenderer = sourceBetween("function normalizeMarkdownLinkTarget(target)", "function normalizeQuickFollowupLabel(rawLabel)");
const followupRenderer = sourceBetween("function normalizeQuickFollowupLabel(rawLabel)", "function openCustomStarterBuilderFromFollowup(actionLabel)");
vm.runInContext(`${displayNormalizer}\n${markdownRenderer}\n${followupRenderer}\nthis.testApi = { normalizeAssistantMarkdownForDisplay, extractAssistantEvidence, getEvidenceVerificationStatus, extractMessageQuickFollowups, renderAssistantMarkdown };`, context);

const wrappedReport = [
  "## 2. Artemis 計畫整理",
  "",
  "```report",
  "# Artemis 計畫重點",
  "",
  "## 計畫階段",
  "",
  "| 任務 | 時間與關鍵資訊 |",
  "",
  "|---|---|",
  "",
  "| **Artemis I** | 2022 年完成 |",
  "",
  "| **Artemis II** | 首次人員航天 |",
  "",
  "## Artemis Accords",
  "- 已有多國簽署。",
  "- 提供共同治理原則。",
  "",
  "---",
  "",
  "Suggested next steps:",
  "1. 從 **Artemis IV** 的落地時間表中確認具體月份。",
  "2. 若需要詳細人員名單或技術規格，整理 NASA 官方資料。",
  "3. 若想了解法律細節，查看 [NASA Artemis Accords](https://www.nasa.gov/artemis-accords/)。",
  "```",
].join("\n");

const normalized = context.testApi.normalizeAssistantMarkdownForDisplay(wrappedReport);
assert.ok(normalized.startsWith("## 2. Artemis 計畫整理"));
assert.ok(normalized.includes("# Artemis 計畫重點"));
assert.ok(!normalized.includes("```report"));
assert.ok(!normalized.includes("| 任務 | 時間與關鍵資訊 |\n\n|---|---|"));

const followups = context.testApi.extractMessageQuickFollowups(wrappedReport);
assert.equal(followups.actions.length, 3);
assert.equal(followups.actions[0].label, "從 Artemis IV 的落地時間表中確認具體月份");
assert.equal(followups.actions[2].label, "若想了解法律細節，查看 NASA Artemis Accords");
assert.ok(!followups.body.includes("Suggested next steps"));

const rendered = context.testApi.renderAssistantMarkdown(wrappedReport, { messageId: "test-message" });
assert.ok(rendered.includes("ollama-quick-markdown-table"));
assert.ok(rendered.includes("ollama-quick-followup-action"));
assert.ok(!rendered.includes("<pre><code>"));
assert.ok(!rendered.includes("Suggested next steps"));

const realCode = [
  "```javascript",
  "const answer = 42;",
  "console.log(answer);",
  "```",
].join("\n");
assert.equal(context.testApi.normalizeAssistantMarkdownForDisplay(realCode), realCode);
const renderedRealCode = context.testApi.renderAssistantMarkdown(realCode, { messageId: "code-message" });
assert.ok(renderedRealCode.includes('data-action="copy-code-block"'));
assert.ok(renderedRealCode.includes("ollama-quick-code-copy"));
assert.ok(renderedRealCode.includes("Copy code"));
assert.ok(renderedRealCode.includes("<pre><code>"));
assert.match(
  source,
  /if \(action === "copy-code-block"\)[\s\S]*?navigator\.clipboard\.writeText\(codeNode\.textContent \|\| ""\)/,
);

const documentedPython = [
  "```python",
  "# Setup",
  "def build_report():",
  "    return True",
  "# Notes",
  "- keep this comment-like example",
  "- preserve the code fence",
  "```",
].join("\n");
assert.equal(context.testApi.normalizeAssistantMarkdownForDisplay(documentedPython), documentedPython);

const nestedMarkdown = [
  "````markdown",
  "## Example",
  "",
  "```javascript",
  "const ready = true;",
  "```",
  "````",
].join("\n");
const normalizedNested = context.testApi.normalizeAssistantMarkdownForDisplay(nestedMarkdown);
assert.ok(normalizedNested.startsWith("## Example"));
assert.ok(normalizedNested.includes("```javascript"));
assert.ok(!normalizedNested.includes("````markdown"));

const pseudoLanguageLine = [
  "```",
  "report",
  "# Artemis 摘要",
  "",
  "## 任務",
  "- Artemis I",
  "- Artemis II",
  "```",
].join("\n");
const normalizedPseudoLanguage = context.testApi.normalizeAssistantMarkdownForDisplay(pseudoLanguageLine);
assert.ok(normalizedPseudoLanguage.startsWith("# Artemis 摘要"));
assert.ok(!normalizedPseudoLanguage.startsWith("report"));

const streamingMarkdown = [
  "## 2. Artemis 計畫整理",
  "",
  "```md",
  "Overview",
  "",
  "## Key Milestones",
  "| Mission | Goal |",
  "|---|---|",
  "| Artemis I | Uncrewed test |",
].join("\n");
const normalizedStreaming = context.testApi.normalizeAssistantMarkdownForDisplay(streamingMarkdown);
assert.ok(normalizedStreaming.startsWith("## 2. Artemis 計畫整理"));
assert.ok(normalizedStreaming.includes("## Key Milestones"));
assert.ok(!normalizedStreaming.includes("```md"));

const wrappedMalformedTable = [
  "## 4. 與其他 Artemis 任務的差異（簡要比較）",
  "| 項目 | Artemis III（2025 前） | Artemis IV（本文重",
  "點） |",
  "",
  "|------|------------------------|---------------------------",
  "--|",
  "",
  "| 主要著陸地點 | 月面赤道附近（靠近永恆隕石坑） | 月球南極深處（Polar-South-Aitken） |",
  "",
  "| 任務長度 | 約 1 天（短暫下降與取樣） | 約 7 天（科學觀測、樣本收集、部署實驗） |",
  "",
  "| HLS 版型 | 基於 Starship 全 reusable 架構 | 採用可部分回收的 ascent-descent 分離式設",
  "計，降落階段為一次性 |",
  "",
  "Suggested next steps:",
  "1. 比較 Artemis III 與 Artemis IV 的科學任務。",
  "2. 整理兩次任務使用的登月載具。",
].join("\n");
const normalizedMalformedTable = context.testApi.normalizeAssistantMarkdownForDisplay(wrappedMalformedTable);
assert.ok(normalizedMalformedTable.includes("| 項目 | Artemis III（2025 前） | Artemis IV（本文重 點） |"));
assert.ok(normalizedMalformedTable.includes("| 主要著陸地點 | 月面赤道附近（靠近永恆隕石坑） | 月球南極深處（Polar-South-Aitken） |"));
assert.ok(normalizedMalformedTable.includes("| HLS 版型 | 基於 Starship 全 reusable 架構 | 採用可部分回收的 ascent-descent 分離式設 計，降落階段為一次性 |"));
assert.ok(!normalizedMalformedTable.includes("\n點） |"));
assert.ok(!normalizedMalformedTable.includes("\n--|"));
const renderedMalformedTable = context.testApi.renderAssistantMarkdown(wrappedMalformedTable, { messageId: "malformed-table" });
assert.ok(renderedMalformedTable.includes("ollama-quick-markdown-table"));
assert.ok(renderedMalformedTable.includes("<th>項目</th>"));
assert.ok(renderedMalformedTable.includes("<td>主要著陸地點</td>"));
assert.equal((renderedMalformedTable.match(/ollama-quick-followup-action"/g) || []).length, 2);

const evidenceSource = "Open Copilot keeps sensitive work on the local machine. Teams can share reusable starter workflows.";
const evidenceReply = [
  "Open Copilot can keep sensitive work local.[^E1]",
  "It also guarantees perfect answers.[^E2]",
  "",
  "[^E1]: Open Copilot keeps sensitive work on the local machine.",
  "[^E2]: Open Copilot guarantees perfect answers.",
].join("\n");
const parsedEvidence = context.testApi.extractAssistantEvidence(evidenceReply, { sourceText: evidenceSource });
assert.equal(parsedEvidence.items.length, 2);
assert.equal(parsedEvidence.items[0].id, "E1");
assert.equal(parsedEvidence.items[0].status, "verified");
assert.equal(parsedEvidence.items[1].status, "unverified");
assert.ok(parsedEvidence.body.includes("[[EVIDENCE_REF:E1:verified]]"));
assert.ok(parsedEvidence.body.includes("[[EVIDENCE_REF:E2:unverified]]"));
assert.ok(!parsedEvidence.body.includes("[^E1]:"));

const renderedEvidence = context.testApi.renderAssistantMarkdown(evidenceReply, {
  messageId: "evidence-message",
  evidenceMode: true,
  evidenceSource: {
    title: "Open Copilot",
    url: "https://example.test/open-copilot",
    pageText: evidenceSource,
  },
});
assert.ok(renderedEvidence.includes("ollama-quick-evidence-ref is-verified"));
assert.ok(renderedEvidence.includes("ollama-quick-evidence-ref is-unverified"));
assert.ok(renderedEvidence.includes("ollama-quick-evidence-card is-verified"));
assert.ok(renderedEvidence.includes("ollama-quick-evidence-card is-unverified"));
assert.ok(!renderedEvidence.includes("[^E1]:"));

const evidenceWithFollowup = [
  "The page describes local processing.[^E1]",
  "",
  "[^E1]: Open Copilot keeps sensitive work on the local machine.",
  "",
  "Suggested next steps:",
  "1. Compare the local workflow with a hosted workflow.",
  "2. Turn the result into a checklist.",
].join("\n");
const renderedEvidenceWithFollowup = context.testApi.renderAssistantMarkdown(evidenceWithFollowup, {
  messageId: "evidence-followup",
  evidenceMode: true,
  evidenceSource: { pageText: evidenceSource },
});
assert.ok(renderedEvidenceWithFollowup.includes("ollama-quick-evidence-panel"));
assert.equal((renderedEvidenceWithFollowup.match(/ollama-quick-followup-action"/g) || []).length, 2);

const evidenceInCode = [
  "```text",
  "A literal marker [^E1] remains code.",
  "[^E1]: This is not an evidence definition.",
  "```",
].join("\n");
const parsedCodeEvidence = context.testApi.extractAssistantEvidence(evidenceInCode, { sourceText: evidenceSource });
assert.equal(parsedCodeEvidence.items.length, 0);
assert.ok(parsedCodeEvidence.body.includes("[^E1]: This is not an evidence definition."));

const renderedMissingEvidence = context.testApi.renderAssistantMarkdown("A claim without evidence.", {
  messageId: "missing-evidence",
  evidenceMode: true,
  evidenceSource: { pageText: evidenceSource },
});
assert.ok(renderedMissingEvidence.includes("ollama-quick-evidence-panel is-missing"));

console.log("assistant markdown rendering tests passed");
