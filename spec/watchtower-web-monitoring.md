# Watchtower Web Monitoring Agent

## 功能目的

Watchtower 讓使用者直接從目前頁面建立持續監控。系統在背景定期取得可讀頁面內容、與上一份基準比較，並在符合觀察條件時發出瀏覽器通知。

這個功能不是單純的網頁重新整理器：當使用者提供觀察條件時，Watchtower 會把內容差異交給目前設定的 AI provider 判斷是否相關；沒有條件時則將任何可讀內容變更視為應通知事件。

## 使用者流程

1. 使用者從聊天面板 header 的 `W` 按鈕開啟 Watchtower。
2. 畫面帶入目前頁面標題與 URL。
3. 使用者可輸入觀察條件並選擇 15 分鐘至每日的檢查頻率。
4. 建立監控時立即擷取第一份 baseline，不發送變更通知。
5. 後續排程比對新舊 snapshot。
6. 有差異且符合條件時，新增事件並發出瀏覽器通知。
7. 點擊通知會開啟被監控頁面。
8. 使用者可在同一面板立即檢查、暫停、恢復、開啟來源或刪除監控。

## 擷取策略

1. 若相同 URL 已在瀏覽器分頁中開啟，優先透過 content script 取得實際渲染後的 page context。
2. 若沒有可用分頁，建立非 active 暫存分頁，等待頁面完成、取得 context 後立即關閉。
3. URL 正規化時移除 hash，但保留 query string，避免同一頁內錨點建立重複監控，同時保留查詢條件的語意。
4. snapshot 包含 title、meta description、headings 與可讀 page text，上限 16,000 字元。

## 變更與 Agent 判斷

- snapshot 經 Unicode、空白與換行正規化後，以穩定 hash 判斷是否變更。
- 有變更時產生新增／移除行摘要。
- 沒有觀察條件：直接將事件判定為 relevant。
- 有觀察條件：要求目前 provider 回傳 `{ "relevant": boolean, "summary": string }`。
- provider 不可用、逾時或輸出格式錯誤時，採 fail-open：保留事件並通知，避免漏掉重要變更；錯誤同時寫入 monitor/event 狀態。
- relevant 與 ignored 事件都會保存，方便理解 Agent 是否過濾了某次變更。

## 排程與通知

- 每個 monitor 使用獨立 `chrome.alarms` 名稱：`watchtower-monitor:<id>`。
- extension install 與 browser startup 都會重建所有 enabled monitor 的 alarm。
- 同一 monitor 同時間只能執行一個 check，重複觸發會回傳 `already-running`。
- 通知 id 使用 `watchtower-notification:<id>`。
- 最多保存 50 個 monitors 與最近 120 筆 events。

## UI 契約

- header `W` 按鈕在目前頁面已有 enabled monitor 時顯示 active 狀態。
- monitor 最近一次狀態為 changed 或 error 時顯示 attention badge。
- Watchtower modal 在 split/compact 模式使用單欄，在大型模式使用「目前頁面設定 + 所有監控」雙欄。
- 每張 monitor card 必須顯示 enabled/paused、最近檢查狀態、時間、變更次數與最後摘要或錯誤。
- busy 狀態期間不可重複建立、檢查、切換或刪除。

## Storage Contract

- `watchtowerMonitorsV1`：完整 monitor records，包含 baseline text 與 content hash。
- `watchtowerEventsV1`：最近變更事件，不保存完整頁面 snapshot。
- baseline text 與 content hash 不透過 `watchtower:list` 下發到 content-script UI。

## MVP 邊界

- 監控單一 URL 的整體可讀內容；CSS selector、特定 DOM 區塊與 screenshot diff 留待後續版本。
- 依賴頁面能在一般 Edge 分頁中載入；需要 CAPTCHA、互動式登入或長時間手動操作的頁面可能取得 error 狀態。
- 第一版使用瀏覽器通知，不自動轉送到 Telegram、LINE、Teams、Slack 或 Discord。

## 驗收標準

- 新 monitor 第一次檢查只建立 baseline，不發出 notification。
- 相同正規化內容不建立 event。
- changed snapshot 會更新 baseline，避免同一變更重複通知。
- 有 condition 時，合法的 provider JSON 決定 relevant/ignored。
- provider 判斷失敗時仍保存與通知變更，並記錄 evaluation error。
- pause 會清除 alarm，resume 會重建 alarm。
- browser startup 後 enabled monitors 的 alarms 會恢復。
- 點擊 Watchtower notification 會開啟 monitor URL。
