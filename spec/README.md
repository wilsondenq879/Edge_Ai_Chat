# Open Copilot Rebuild Specs

這份 `spec/` 不是一般產品摘要，而是提供給另一個 AI 或新接手工程師，用來重建 Open Copilot 的功能與畫面風格。

目標不是「做出類似產品」，而是盡可能做出和目前專案一致的資訊架構、互動節奏、主要狀態、視覺語言與資料流。

## 重建原則

- 先遵守功能 contract，再做內部實作替換。
- 先遵守畫面結構與樣式語氣，再微調視覺細節。
- 使用者感受到的操作流程要與現有版本一致。
- 若重建時遇到不明確處，優先以本 repo 的 `src/*.html`、`src/*.js`、`src/*.css` 為準。

## 必讀文件

1. [Design System and UI Language](./design-system-and-ui-language.md)
2. [Visual Style Tokens](./visual-style-tokens.md)
3. [Component Inventory and DOM Contract](./component-inventory-and-dom-contract.md)
4. [Interaction and State Machine](./interaction-and-state-machine.md)
5. [Data Model and Payload Contract](./data-model-and-payload-contract.md)
6. [In-Page Chat Panel](./in-page-chat-panel.md)
7. [Attachments and Context](./attachments-and-context.md)
8. [Starters and Agent Flows](./starters-and-agent-flows.md)
9. [Multi-Perspective Analysis](./multi-perspective-analysis.md)
10. [GitHub Article Structure Review Starter](./github-article-structure-review-starter.md)
11. [Task Reminders](./task-reminders.md)
12. [Local Work Folder and Drive Sync](./local-work-folder-and-drive-sync.md)
13. [Settings and Provider Config](./settings-and-provider-config.md)
14. [Popup Model Selection](./popup-model-selection.md)
15. [Landing Page Template Selector And Generation Flow](./landing-page-template-selector-and-generation-flow.md)
16. [PowerPoint Starter And Export](./powerpoint-starter-and-export.md)
17. [URL(s) to Sales Kit PPTX Flow](./url-to-sales-kit-pptx-flow.md)
18. [Investment Proposal Builder](./investment-proposal-builder.md)
19. [Multi-page Word Report Starter](./multi-page-word-report-starter.md)
20. [Evidence Mode](./evidence-mode.md)
21. [Watchtower Web Monitoring Agent](./watchtower-web-monitoring.md)

## 主要原始碼對照

| 領域 | 主要檔案 |
| --- | --- |
| Popup | `src/popup.html`, `src/popup.js`, `src/ui.css` |
| Settings | `src/options.html`, `src/options.js`, `src/ui.css` |
| In-page UI | `src/content-script.js`, `src/injected.css` |
| 資料與背景邏輯 | `src/background.js` |
| Browser extension 定義 | `manifest.json` |

## 功能地圖

| 功能 | 入口 | 核心行為 |
| --- | --- | --- |
| Popup 模型切換 | extension popup | 看 endpoint、抓模型、切換 selected model |
| Settings | options page | 以 top-level tabs 管理 General、AI Provider、Embedding、Notifications、Starter、Agent Flow、Tools |
| 浮動聊天面板 | 任意一般網頁 | 右側 launcher、收合展開、聊天、最大化 |
| Context / Attachments | 聊天面板 | 自動頁面 context、圖片、文件、GitHub source、tabs |
| Starters / Flows | 聊天面板與 settings | 依頁型推薦、快速套用、建立 reusable workflows |
| Multi-Perspective | 聊天面板 | 多個角色逐步分析，最後 synthesis |
| Task Reminders | 聊天面板 | 從聊天抽 task，儲存 reminder，做 alarm/notification |
| Local / Drive Sync | settings + export | 本機資料夾與 Google Drive app data 同步 |
| Batch URL QA | 聊天面板 workflow + settings logs | 批次讀網址、產生 grounded FAQ、輸出單一 JSONL、記錄 job 狀態 |
| Landing Page Builder | 聊天面板 starter workflow | 分析來源頁面、顯示帶圖 template selector、依選定版型生成 landing page |
| PowerPoint Starter Export | 聊天面板 starter workflow | 把來源內容整理成 slide JSON，並匯出可開啟的 `.pptx` |
| Multi-page Word Report | 聊天面板 starter workflow | 整合目前頁面、最多五個分頁與文件，匯出有圖片與來源清單的 `.docx` |
| URL(s) to Sales Kit PPTX | 聊天面板 starter workflow | 收集一到多個產品 URL，抽取頁面資產，生成 sales kit `.pptx` |
| Investment Proposal Builder | 聊天面板 starter -> 獨立 extension 視窗 | 填寫投資抵減提案資料，生成附表6與附表7 `.docx` |
| Notifications | settings | Telegram / LINE / Teams / Slack / Discord 測試與完成通知 |
| UI Localization | popup + settings + in-page panel | `uiLanguage` 控制介面語言，`replyLanguage` 控制模型回覆語言 |
| Teams Inline Action | Microsoft Teams 頁面 | hover 訊息時顯示 `Send to Open Copilot` 動作 |
| Evidence Mode | 聊天面板側欄與回答 | 逐字引文驗證、來源卡片、點擊跳回目前頁面並高亮 |
| Watchtower | 聊天面板 header + 背景排程 | 建立頁面 baseline、定期比對、條件式 Agent 判斷、事件與瀏覽器通知 |

## 對 AI 重建者的要求

- 不可把右側浮動工作台改成一般全頁聊天頁。
- 不可把視覺風格改成通用白底 SaaS 面板。
- 不可把 starters 降級成單純 prompt dropdown。
- 不可忽略 maximized workspace、task rail、include panels。
- 不可省略資料狀態：`selectedModel`、`pageContextMode`、`chatMessages`、`customStarters`、`taskReminderItems`。

## 共享樣式結論

- Settings / Popup：深色玻璃感儀表板，藍青色光暈，厚圓角，高透明度卡片。
- In-page panel：超高 z-index 的右側浮動工作台，含發光 orb launcher。
- 視覺氣質：不是極簡企業後台，而是「local-first AI cockpit」。

## 近期已跟上的實作重點

- Settings 已不是單一長表單，而是上層分成 `General`、`AI Provider`、`Embedding`、`Notifications`、`Starter`、`Agent Flow`、`Tools` 七個 tab。
- `uiLanguage` 已與 `replyLanguage` 分離；popup 會優先跟 `uiLanguage` 走。
- 通知通道已包含 Telegram、LINE、Teams、Slack、Discord。
- Embedding 設定已獨立成 top-level tab，KB tester 會使用預設 embedding provider。
- Tools tab 可從 extension origin 開啟 JSONL QA Editor 與 Knowledge Base QA Tester。
- Batch URL QA 已改為輸出 `.jsonl`，並支援 job logs、取消執行、唯一檔名與完成通知。
- Investment Proposal Builder 可由 starter 開獨立視窗，生成附表6與附表7 `.docx`。
- `landingPowerPoint` 已強化成多來源故事線、逐頁來源追蹤與語意圖片配對。
- `multiPageWordReport` 可把目前頁面、加入分頁與文件整理成一般用途的圖文 `.docx` 報告。
- Teams 頁面支援 inline `Send to Open Copilot` hover action。
