# Multi-page Word Report Starter

## 功能目的

Built-in starter `multiPageWordReport` 把目前頁面、最多五個加入的 browser tabs，以及加入的文件整合成一份可直接下載的圖文 Word 報告。

它不是固定表單，也不取代 `investmentProposalBuilder`：

- `investmentProposalBuilder`：只處理台灣投資抵減附表 6、附表 7
- `multiPageWordReport`：處理一般研究、比較、彙整、簡報前置報告等多來源任務

## 操作契約

- starter 會自動使用目前頁面 context。
- 使用者可從「加入分頁」選擇最多五個其他網頁。
- 使用者可另外加入文字、Markdown、CSV、PDF 等既有附件來源。
- 模型只輸出受限 JSON；前端在下載時把 JSON 封裝成真正的 `.docx`。
- 聊天訊息只顯示生成進度與下載按鈕，不貼出整段原始 JSON。

## JSON 契約

```json
{
  "title": "Report title",
  "subtitle": "Optional subtitle",
  "executiveSummary": "Two to four compact paragraphs",
  "sections": [
    {
      "heading": "Section heading",
      "summary": "Section lead",
      "paragraphs": ["Paragraph one"],
      "bullets": ["Evidence or takeaway"],
      "imageUrl": "https://source.example/image.jpg",
      "imageAlt": "Source image description",
      "sourceUrl": "https://source.example/article"
    }
  ],
  "sources": [
    {
      "title": "Source title",
      "url": "https://source.example/article"
    }
  ]
}
```

## 內容要求

- 產出 5–9 個有明確目的的章節。
- 先整理共同主題、差異、證據與結論，不可依 tab 順序逐頁貼摘要。
- 每個重要網頁來源都要出現在 section 的 `sourceUrl` 或最後來源清單。
- 加入的本機文件即使沒有 URL，也要以檔名列入來源清單。
- 來源互相衝突時，報告必須明確說明，不可混成無出處結論。
- 最後章節應整理跨來源結論、建議或下一步。

## 圖片安全與配對

- 只允許使用目前頁面或加入分頁實際提供的 image candidates。
- 模型捏造或自行搜尋的圖片 URL 在匯出前必須移除。
- 匯出前以章節標題、摘要、段落、bullets、圖片 alt 與來源標題做語意配對。
- 圖片要嵌入 `.docx`，不可只留下遠端連結。
- 圖片抓取失敗時略過該圖，但整份文件仍要能輸出。

## DOCX 版面

- A4 頁面。
- 封面包含標題、副標題、來源數與產生日期。
- 第二頁先放執行摘要。
- 每章有清楚 heading、lead、短段落、bullets、可選圖片、圖說與來源網址。
- 最後附完整來源清單。
- footer 顯示頁碼。
- 主要字型使用 Aptos，東亞字型使用 Microsoft JhengHei。

## 驗收標準

- 下載副檔名與 MIME type 都是 `.docx`。
- Microsoft Word、Apple Pages 或 Google Docs 可直接開啟，且不顯示修復警告。
- 無圖片來源時仍可產出純文字報告。
- 有圖片來源時至少約六成章節應有相關真實圖片，候選不足時除外。
- 多來源網址與加入文件不會從來源清單消失。
- `dist/` 與 `src/` 保持同步。
