# Evidence Mode

## 功能目的

Evidence Mode 讓一般聊天回答附上可由前端驗證的目前頁面逐字引文，並讓使用者從回答中的引用直接跳回原始網頁位置。

第一版只驗證 `CURRENT PAGE CONTEXT`，不把附件、Browser Tabs、GitHub source 或 Web Search 混入同一套定位規則。

## 使用者流程

1. 使用者可在大型模式的聊天面板側欄，或分割／小窗模式的狀態列快捷開關，開啟 `Evidence Mode`。
2. 系統把 page context mode 固定成 `always`。
3. 一般聊天請求要求模型在受支持的敘述後加入 `[^E1]` 格式引用。
4. 模型在正文後提供一行一筆的逐字證據定義：`[^E1]: exact source passage`。
5. 顯示層移除原始定義，改成 inline citation 與 Evidence cards。
6. 前端把引文和送出當下的頁面快照比對，標示 `verified` 或 `unverified`。
7. 點擊 inline citation 或 card 時，系統在目前 DOM 尋找最小匹配元素、捲動到該處並暫時高亮。

## 驗證契約

- 每筆 evidence 必須有正規化後的 `E<number>` id。
- 引文長度至少 8 個正規化字元才可能被標為 verified。
- 驗證允許 Unicode 正規化與空白合併，但不允許語意近似取代逐字內容。
- 找不到快照中的引文時必須標成 unverified，不可靜默當成有效來源。
- 找不到目前 DOM 時要明確提示頁面可能已經變更。
- code fence 裡的 footnote-like 文字不可被當成 Evidence Mode 定義。

## UI 契約

- 側欄要有清楚的 Evidence Mode on/off 控制與用途說明。
- 分割與小窗模式要在狀態列右側顯示短版「證據」快捷開關；大型模式由側欄控制，避免重複佔位。
- inline citation 使用小型編號 pill；verified 與 unverified 必須有不同顏色。
- Evidence panel 顯示已驗證數量、來源頁面、每筆引文與驗證狀態。
- 模式已啟用但模型沒有提供任何可解析 evidence 時，要顯示未查證警告。
- 頁面高亮不得永久修改來源頁面，應在數秒後自動移除。

## 第一版邊界

- 一般聊天與一般 starter 回答支援 Evidence Mode。
- PowerPoint、Word、HTML 等結構化 artifact 生成不套用 Evidence Mode，以免破壞輸出 schema。
- Multi-Perspective 與 Agent Flow 暫不套用 Evidence Mode。
- PDF 頁碼、GitHub 行號、附件段落與跨分頁定位留待後續版本。

## 驗收標準

- verified citation 必須確實存在於請求當下的 current-page snapshot。
- unverified citation 不得顯示成綠色 verified 狀態。
- 點擊仍存在於目前 DOM 的引文，可以捲動並高亮對應內容。
- Evidence definitions 不會以原始 footnote 文字重複顯示在回答中。
- 一般 Markdown、table、code fence 與 follow-up actions 的既有 rendering 不受影響。
