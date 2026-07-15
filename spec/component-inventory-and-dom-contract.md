# Component Inventory and DOM Contract

## 目的

這份文件定義「畫面是由哪些可見元件組成」，讓另一個 AI 在重建時，不會只做出功能相似的頁面，而是能更貼近目前的 DOM 區塊與資訊階層。

## Popup DOM Contract

```text
body.popup-page
|- main.panel.popup-panel
   |- .panel-header.compact
   |  |- #popupEyebrow
   |  |- #popupTitle
   |- .inline-row
   |  |- #popupEndpointLabel
   |  |- #endpointValue
   |  |- #openOptions
   |- section
      |- .status-header
      |  |- #popupModelsTitle
      |  |- #refreshModels
      |- #popupMessage
      |- #popupModels
```

## Settings DOM Contract

```text
body.settings-page
|- .settings-backdrop
|- main.panel.settings-panel
   |- .panel-header.settings-header
   |- .actions.settings-toolbar
   |- .utility-tabs.settings-page-tabs
   |- section.settings-tab-panels
      |- #generalTabPanel
      |  |- .settings-layout
      |  |  |- .setting-card.utility-card.behavior-card.side-card
      |  |  |- .provider-support-grid
      |- #aiProviderTabPanel
      |  |- .settings-layout
      |  |  |- .setting-card.provider-priority-card
      |  |  |- article.setting-card.provider-card
      |  |     |- .provider-tabs
      |  |     |- #providerStatusMessage
      |  |     |- #testButton
      |  |     |- #panel-ollama / #panel-lmStudio / #panel-gemini / #panel-azureOpenAi
      |  |     |- .provider-support-grid
      |- #embeddingProviderTabPanel
      |  |- .settings-layout
      |  |  |- .setting-card.provider-priority-card
      |  |  |- .provider-support-grid
      |- #notificationTabPanel
      |  |- .provider-support-grid
      |- #starterTabPanel
      |  |- .starter-library-hero
      |  |- .starter-studio-shell
      |- #flowTabPanel
      |  |- .starter-library-hero
      |  |- .starter-studio-shell
      |- #toolsTabPanel
      |  |- .tools-panel-shell
      |     |- .tools-card-grid
|- #starterAiEditorModal
|- #starterFlowEditorModal
|- #batchUrlQaLogsModal
```

## In-Page Host DOM Contract

```text
#ollama-quick-chat-host
|- .ollama-quick-shell
   |- button.ollama-quick-launcher
   |- section.ollama-quick-panel
      |- header.ollama-quick-header
      |- .ollama-quick-workspace
      |  |- .ollama-quick-main-pane
      |  |  |- .ollama-quick-status-wrap
      |  |  |  |- button.ollama-quick-evidence-quick-toggle (split/compact only)
      |  |  |- [data-role='messages']
      |  |  |- .ollama-quick-compose
      |  |- aside.ollama-quick-task-rail (optional)
      |  |- aside.ollama-quick-sidebar
      |     |- .ollama-quick-controls
      |     |- .ollama-quick-include-panel x N
      |     |- .ollama-quick-starters-panel
      |- include/browser/local pickers (conditional)
      |- custom starter builder (conditional)
      |- agent flow builder (conditional)
      |- batch URL QA builder (conditional)
```

## Main Pane Contract

```text
.ollama-quick-main-pane
|- status row
|- message timeline
|  |- .ollama-quick-message.is-user
|  |- .ollama-quick-message.is-assistant
|  |- .ollama-quick-perspective-panel
|  |- .ollama-quick-task-panel (embedded mode)
|- compose area
   |- .ollama-quick-dropzone
   |- .ollama-quick-compose-attachments
   |- .ollama-quick-compose-upload
   |- textarea[data-role='prompt']
   |- button[data-action='send-message']
```

## Sidebar Contract

- 第一區一定是 model select 與 page context mode select
- include panel 順序固定：
  - browser tabs
  - local documents
  - GitHub include
- starter panel 在側欄最下方

## Task Panel Contract

```text
.ollama-quick-task-panel
|- .ollama-quick-task-panel-head
|- .ollama-quick-task-tabs
|- .ollama-quick-task-stack
   |- .ollama-quick-task-section.is-candidates or .is-saved
      |- .ollama-quick-task-list
         |- .ollama-quick-task-card
```

## Starter Card Contract

### Settings

```text
.starter-preview-card
|- .starter-preview-head
|  |- .starter-preview-skill-meta
|  |  |- .starter-preview-skill-kicker
|  |  |- .starter-preview-name
|  |- .starter-preview-actions
|     |- .starter-preview-mode
|     |- edit button
|     |- delete button
|- .starter-preview-scopes
|- .starter-preview-prompt
```

### In-page

```text
button.ollama-quick-starter
|- optional .ollama-quick-starter-dot
|- label span
|- optional .ollama-quick-starter-custom-tag
```

## Attachment Contract

```text
attachments strip
|- .ollama-quick-attachment (image)
|  |- img
|  |- .ollama-quick-remove-attachment
|- .ollama-quick-attachment.ollama-quick-attachment-doc
   |- .ollama-quick-attachment-doc-label
   |- .ollama-quick-attachment-doc-name
   |- .ollama-quick-remove-attachment
```

## DOM Integrity Rules

- `data-role` 和 `data-action` 類型節點要保留，因為互動綁定大量依賴它們。
- overlay / picker / modal 都是條件渲染，但開啟時要仍屬於同一 host 節點內。
- maximized 與 non-maximized 主要透過 class 切換，不是換一套全新 DOM。
- settings page 有 top-level tabs 與 provider tabs 兩層 tab 結構，兩者都要保留。
