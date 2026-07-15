# Data Model and Payload Contract

## 目的

這份文件定義重建時不可隨意改動的主要資料模型、session schema、starter schema、task schema 與送給模型的 payload 結構。

## Config Contract

### Core config fields

```ts
type Config = {
  ollamaUrl: string;
  ollamaEmbeddingUrl: string;
  ollamaEmbeddingModel: string;
  lmStudioUrl: string;
  lmStudioEmbeddingUrl: string;
  lmStudioModel: string;
  lmStudioEmbeddingModel: string;
  lmStudioApiKey: string;
  lmStudioEmbeddingApiKey: string;
  geminiModel: string;
  geminiEmbeddingModel: string;
  azureOpenAiEndpoint: string;
  azureOpenAiEmbeddingEndpoint: string;
  azureOpenAiDeployment: string;
  azureOpenAiEmbeddingDeployment: string;
  azureOpenAiApiVersion: string;
  azureOpenAiEmbeddingApiVersion: string;
  defaultProvider: "ollama" | "lmStudio" | "gemini" | "azureOpenAi";
  defaultEmbeddingProvider: "ollama" | "lmStudio" | "gemini" | "azureOpenAi";
  selectedModel: string;
  modelSelectionMode: "auto" | "manual";
  starterModelRoutingEnabled: boolean;
  starterReasoningModel: string;
  starterVisionModel: string;
  uiLanguage: string;
  replyLanguage: string;
  settingsTheme: "system" | "dark" | "light";
  taskExtractionWindowDays: number;
  floatingIconEnabled: boolean;
  starterHoverTipsEnabled: boolean;
  teamsInlineActionEnabled: boolean;
  evidenceModeEnabled: boolean;
  telegramNotificationEnabled: boolean;
  telegramChatId: string;
  lineNotificationEnabled: boolean;
  lineTo: string;
  teamsNotificationEnabled: boolean;
  slackNotificationEnabled: boolean;
  discordNotificationEnabled: boolean;
  googleDriveClientId: string;
  googleDriveSyncEnabled: boolean;
  googleDriveAutoSync: boolean;
  githubApiKeyConfigured: boolean;
  geminiApiKeyConfigured: boolean;
  geminiEmbeddingApiKeyConfigured: boolean;
  azureOpenAiApiKeyConfigured: boolean;
  azureOpenAiEmbeddingApiKeyConfigured: boolean;
  telegramBotTokenConfigured: boolean;
  lineChannelAccessTokenConfigured: boolean;
  teamsWebhookUrlConfigured: boolean;
  slackWebhookUrlConfigured: boolean;
  discordWebhookUrlConfigured: boolean;
  multiPerspectiveProfiles: string;
  customStarters: Starter[];
  hiddenBuiltinStarterIds: string[];
  recentGithubFiles: unknown[];
  systemPrompt: string;
};
```

### Secret config fields

```ts
type SecretConfig = {
  githubApiKey: string;
  geminiApiKey: string;
  geminiEmbeddingApiKey: string;
  azureOpenAiApiKey: string;
  azureOpenAiEmbeddingApiKey: string;
  telegramBotToken: string;
  lineChannelAccessToken: string;
  teamsWebhookUrl: string;
  slackWebhookUrl: string;
  discordWebhookUrl: string;
};
```

重建時要保留「可顯示是否已設定，但不直接把密鑰明文下發到 client UI」的概念。

## Starter Contract

```ts
type Starter = {
  id: string;
  label: string;
  prompt?: string;
  description?: string;
  scopes: string[];
  mode?: "chat" | "perspective" | "flow";
  composeMode?: "chat" | "perspective" | "flow";
  isCustomStarter?: boolean;
  updatedAt?: string;
  flowSteps?: FlowStep[];
};
```

### Flow step contract

```ts
type FlowStep = {
  starterId: string;
  label?: string;
};
```

## Message Contract

```ts
type ChatMessage = {
  id: number | string;
  role: "user" | "assistant";
  content: string;
  attachments?: OutgoingAttachments;
  evidenceMode?: boolean;
  evidenceSource?: {
    title: string;
    url: string;
    selection: string;
    pageText: string;
    capturedAt: string;
  } | null;
  flowRun?: AgentFlowRun;
};
```

## Outgoing Attachments Contract

```ts
type OutgoingAttachments = {
  images?: Array<{
    id: string;
    name: string;
    previewUrl?: string;
    mimeType?: string;
  }>;
  documents?: Array<{
    id: string;
    name: string;
    path?: string;
    content?: string;
  }>;
  githubSources?: Array<{
    type: "repo" | "file";
    repoFullName: string;
    ref?: string;
    path?: string;
    title?: string;
    content?: string;
  }>;
  browserTabs?: Array<{
    tabId: number | string;
    title: string;
    url: string;
    content?: string;
  }>;
};
```

## Latest Perspective Run Contract

```ts
type PerspectiveStage = {
  id: string;
  label: string;
  instruction: string;
  content: string;
};

type LatestPerspectiveRun = {
  stages: PerspectiveStage[];
  finalContent: string;
  expandedKey?: string;
  isComplete?: boolean;
};
```

## Task Reminder Contract

```ts
type TaskReminder = {
  id: string;
  title: string;
  summary?: string;
  owner?: string;
  dueAt?: string;
  reminderAt?: string;
  evidence?: string;
  confidence?: string;
  status?: "open" | "completed";
  sourceMessageId?: string | number;
};
```

## Chat Session Contract

這是目前產品非常關鍵的儲存單位，至少要保留這些欄位：

```ts
type ChatSession = {
  savedAt: string;
  pageTitle: string;
  pageUrl: string;
  selectedModel: string;
  replyLanguage: string;
  pageContextMode: "auto" | "always" | "never";
  includePageContext?: boolean;
  messages: ChatMessage[];
  latestPerspectiveRun?: LatestPerspectiveRun | null;
};
```

## Storage Key Contract

| Key | 用途 |
| --- | --- |
| `latestChatSession` | 最近一份聊天 session |
| `taskReminderItems` | 已儲存 task reminders |
| `batchUrlQaJobs` | 最近的 Batch URL QA jobs 與執行進度 |
| `googleDriveSyncMeta` | Drive 連線與同步狀態 |
| `googleDriveSyncDocuments` | Drive sync documents |
| `work-folder-handle` | 本機資料夾 handle |
| `localWorkFolderMeta` | 本機資料夾描述資訊 |

## Provider Request Contract

送給模型前，payload 至少要保留這些概念層次：

```ts
type ModelRequest = {
  model: string;
  systemPrompt: string;
  replyLanguage: string;
  pageContextMode: "auto" | "always" | "never";
  userMessage: string;
  pageContext?: string;
  attachments?: OutgoingAttachments;
  priorMessages?: ChatMessage[];
};
```

## Prompt Assembly Contract

組 prompt 時不可失去以下語意：

- 回覆語言要求
- system prompt
- 使用者本次訊息
- 當前頁面 context
- 額外附加來源
- 若在 flow 或 perspective 模式，還要保留 stage / step 的上下文

## Export Contract

匯出 Markdown/HTML 時，session 內容至少要能覆蓋：

- savedAt
- page URL
- model
- reply language
- page context mode
- conversation messages
- multi-perspective final result 與各 stage

## Merge Contract

當做 local folder pull / Drive pull 時：

- `customStarters` 依 `id` merge
- `latestChatSession` 以時間選較新者
- tasks 不能無條件覆蓋

## Rebuild Guardrails

- 不可把 `customStarters` 簡化成單一字串陣列
- 不可把 `uiLanguage` 和 `replyLanguage` 重新混成同一個欄位
- 不可把通知通道設定只做成前端假欄位而沒有 secret/configured 狀態
- 不可讓 `latestPerspectiveRun` 只剩 finalContent
- 不可把 attachments 全塞進 `content` 字串而失去結構
