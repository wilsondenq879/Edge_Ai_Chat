# PowerPoint Starter And Export

## 功能目的

這份文件定義 built-in starter `landingPowerPoint` 的用途與匯出契約。

它的定位不是取代 `landingHtml`，而是提供另一條更偏「交付檔案」的路徑：

- `landingHtml`：輸出可直接開啟、可持續修改的單頁簡報 HTML
- `landingPowerPoint`：輸出可下載、可分享、可在 PowerPoint / Keynote / Google Slides 開啟的 `.pptx`

## 產品要求

- `landingPowerPoint` 必須是 built-in starter
- 它應與 `landingHtml` 一樣吃目前頁面、最多五個附加分頁、附加文件與來源圖片
- 模型不可直接輸出 `.pptx` 二進位；必須先輸出受限的 slide JSON
- 前端匯出器負責把 slide JSON 組成真正的 `.pptx`
- 匯出結果要優先追求可開啟、可編輯、可閱讀，而不是追求花俏動畫

## JSON 契約

模型輸出固定為單一 JSON code block。

根物件：

```json
{
  "title": "Deck title",
  "theme": {
    "backgroundColor": "#F7F4EE",
    "textColor": "#171717",
    "accentColor": "#C96B3B"
  },
  "slides": []
}
```

每張 slide 只允許：

- `title`
- `subtitle`
- `body`
- `bullets`
- `imageUrl`
- `imageAlt`
- `notes`
- `sourceUrl`
- `layout`

`layout` 只允許：

- `title`
- `content`
- `image-left`
- `image-right`

## 匯出契約

- 副檔名固定為 `.pptx`
- 匯出流程需在聊天訊息中顯示進度卡
- 進度至少包含：
  - 整理內容
  - 生成投影片
  - 封裝 PPTX
- 若模型沒給出可解析 JSON，必須明確失敗，不可下載壞檔
- 若某張投影片圖片抓不到，允許退回文字版，但不可讓整份 deck 無法匯出
- 模型提供的圖片 URL 必須存在於實際 source image candidates；捏造 URL 要在匯出前移除

## 版型要求

- 第一張應明顯像 cover / executive summary
- 純文字 slide 應有卡片化資訊層次，不可只是大段文字直接鋪滿
- 圖片 slide 應有明確的文字區與圖片區，不可互相擠壓
- 圖片應以投影片標題、內文、bullets、圖片 alt 與來源標題做語意配對，不可只依候選順序塞入
- 所有 slide 都應保留 slide number / footer 或等價導覽感
- 版型需吃 `theme.backgroundColor`、`theme.textColor`、`theme.accentColor`

## 與 HTML Starter 的差異

- PowerPoint 版不支援 Mermaid、scroll-snap、sticky section 這種 web 專屬表現
- 若來源是圖表 / 流程圖，應轉成簡潔 bullet 與敘述，而不是保留 HTML / Mermaid
- PowerPoint 版的資訊密度應比 HTML 更克制

## 多來源故事線與追蹤

- 產出應以共同主題、比較與證據組織，不可依 tab 順序逐頁摘要。
- 每個有實質內容的網頁來源至少應被一張投影片引用。
- `sourceUrl` 應使用實際原始網址；圖片來源可用來補回缺少的 `sourceUrl`。
- 來源互相衝突時要保留差異，不可合併成沒有出處的結論。
- 倒數第二張適合呈現跨來源洞察或比較，最後一張保留結論與 next steps。

## 真實匯出 Smoke Test Flow

### 測試環境

- Edge 載入 repo 內最新 `dist/`
- 至少準備兩種來源頁面：
  - 純文字 / 文章型頁面
  - 含至少一張真實圖片的頁面
- 本機至少可用下列其中一種開檔：
  - Microsoft PowerPoint
  - Apple Keynote
  - Google Slides 匯入

### Smoke Test 1: 文章頁匯出

1. 開啟一般文章頁
2. 叫出 Open Copilot
3. 點 `多網頁圖文 PowerPoint`
4. 等到進度卡顯示完成
5. 下載 `.pptx`
6. 用 PowerPoint / Keynote / Google Slides 開啟

預期結果：

- 不應出現 repair / recovery 對話框
- 至少有 5 張可閱讀投影片
- 第一張像封面或摘要
- 最後一張像結論或 next steps
- 文字不應大面積溢出到投影片外

### Smoke Test 2: 圖片頁匯出

1. 開啟含真實圖片的頁面
2. 重跑 `landingPowerPoint`
3. 下載 `.pptx`
4. 用實際投影片軟體開啟

預期結果：

- 至少一張 slide 帶入真實圖片
- 圖片與文字不互相重疊
- 即使某張圖失敗，也應仍能匯出 deck

### Smoke Test 3: 多來源整合

1. 在聊天面板加入 browser tabs 或文件來源
2. 執行 `landingPowerPoint`
3. 下載 `.pptx`
4. 實際開檔檢查

預期結果：

- deck 故事線不是只重述單一來源
- 不同來源的共同主題有被整合
- 若有來源 URL，footer 或 notes 應看得到可追溯線索

## 驗收標準

- `.pptx` 可被主流投影片工具直接開啟
- deck 有清楚視覺階層，而不是只有 bare text
- 下載檔名合理，預設由 deck title 或頁面 title 推得
- `dist/` 必須與最新 source 同步
