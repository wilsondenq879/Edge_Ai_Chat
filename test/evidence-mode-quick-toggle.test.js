const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "src/content-script.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "src/injected.css"), "utf8");

assert.match(
  script,
  /class="ollama-quick-evidence-quick-toggle \$\{evidenceModeEnabled \? "is-active" : ""\}"/,
  "status row should reflect the persisted Evidence Mode state",
);
assert.match(
  script,
  /ollama-quick-evidence-quick-toggle[\s\S]*?data-action="toggle-evidence-mode"/,
  "status-row shortcut should reuse the existing Evidence Mode action",
);
assert.match(
  styles,
  /#ollama-quick-chat-host\.is-panel-open:not\(\.is-panel-maximized\) \.ollama-quick-evidence-quick-toggle\s*\{\s*display: inline-flex;/,
  "shortcut should be visible in split and compact modes",
);
assert.match(
  styles,
  /\.ollama-quick-evidence-quick-toggle\s*\{[\s\S]*?display: none;/,
  "shortcut should stay hidden in large mode where the full sidebar control is available",
);
assert.match(
  script,
  /class="ollama-quick-evidence-control \$\{evidenceModeEnabled \? "is-active" : ""\}"/,
  "large mode should retain the full Evidence Mode control",
);

console.log("evidence mode quick toggle tests passed");
