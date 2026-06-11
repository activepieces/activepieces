import { SeekPage } from '../../core/common/seek-page'
import { AIProviderName } from '../../management/ai-providers'
import { AiUsageActionName, AiUsageEvent } from '../../management/ai-providers/ai-usage'
import { AgentFlowTool, AgentKnowledgeBaseTool, AgentMcpTool, AgentOutputField, AgentPieceToolMetadata } from '../agents'
import { PopulatedFlow } from '../flows/flow'
import { Filter } from '../tables/dto/records.dto'

export enum ExecuteAiMode {
    TEXT = 'text',
    IMAGE = 'image',
}

export enum AgentYieldStatus {
    NEED_TOOLS = 'NEED_TOOLS',
    DONE = 'DONE',
    FAILED = 'FAILED',
    TIMEOUT = 'TIMEOUT',
}

/**
 * Single-shot AI request from the sandbox to the worker (`context.ai.execute`).
 *
 * It MUST NOT carry provider credentials. The `engineToken` (which the sandbox already holds as
 * `context.server.token`) is the authorization envelope: the worker forwards it to the API, which
 * derives the trusted `platformId`/`projectId` from it (the same model as the existing
 * `GET /v1/ai-providers/:provider/config` route). `projectId`/`flowId`/`runId`/`stepName`/
 * `actionName` are sandbox-supplied observability + provider-metadata only — untrusted, never an
 * input to billing.
 */
export type ExecuteAiRequest = {
    mode: ExecuteAiMode
    provider: AIProviderName
    model: string
    engineToken: string
    messages?: unknown[]
    system?: string
    prompt?: string
    maxOutputTokens?: number
    temperature?: number
    providerOptions?: Record<string, unknown>
    n?: number
    size?: string
    aspectRatio?: string
    /** TEXT mode: the worker builds the provider-native web-search tools (and switches OpenAI to the responses API) itself. */
    webSearchEnabled?: boolean
    webSearchOptions?: Record<string, unknown>
    /** IMAGE mode: base64 source images for editing/variation/merging. */
    inputImages?: string[]
    schema?: Record<string, unknown>
    projectId?: string
    flowId?: string
    runId?: string
    stepName?: string
    actionName?: AiUsageActionName
}

export type ExecuteAiImage = {
    base64: string
    mediaType?: string
}

export type AiTokenUsage = {
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
    reasoningTokens?: number
    cachedInputTokens?: number
}

export type ExecuteAiResponse = {
    text?: string
    object?: unknown
    /** IMAGE mode results, and TEXT-mode generated files (providers that emit images over the text API). */
    images?: ExecuteAiImage[]
    /** Web-search citations. Present (possibly empty) whenever tool-based web search was active. */
    sources?: unknown[]
    finishReason?: string
    usage?: AiTokenUsage
}

export type AgentPieceToolDescriptor = {
    toolName: string
    description: string
    pieceMetadata: AgentPieceToolMetadata
}

/**
 * Fully serializable inputs for the worker-side agent loop. Built engine-side from the run-agent
 * step's resolved props + server context. Worker-native tools (mcp/kb/flow/web-search/completion)
 * are built and run on the worker; piece tools are dispatched back to the engine via `NEED_TOOLS`
 * yields. Carries no provider credentials — the worker resolves them server-side.
 */
export type RunAgentConfig = {
    agentRunId: string
    prompt: string
    maxSteps: number
    provider: AIProviderName
    model: string
    structuredOutput?: AgentOutputField[]
    mcpTools: AgentMcpTool[]
    knowledgeBaseTools: AgentKnowledgeBaseTool[]
    flowTools: AgentFlowTool[]
    pieceTools: AgentPieceToolDescriptor[]
    webSearchEnabled: boolean
    webSearchOptions?: Record<string, unknown>
    engineToken: string
    apiUrl: string
    publicUrl: string
    stepName: string
    projectId: string
    runId: string
}

/**
 * The piece-supplied portion of {@link RunAgentConfig}. The engine bridge (`context.agent.run`)
 * injects the trusted/server fields (`engineToken`/`apiUrl`/`publicUrl`/`stepName`/`projectId`/
 * `runId`) before forwarding to the worker, so the sandbox never supplies them.
 */
export type RunAgentRequest = Omit<RunAgentConfig, 'engineToken' | 'apiUrl' | 'publicUrl' | 'stepName' | 'projectId' | 'runId'>

export type AgentToolCall = {
    toolCallId: string
    toolName: string
    input: Record<string, unknown>
}

export type AgentToolResult = {
    toolCallId: string
    output: unknown
}

export type ContinueAgentRequest = {
    agentRunId: string
    toolResults: AgentToolResult[]
}

export type AgentYield =
    | { status: AgentYieldStatus.NEED_TOOLS, agentRunId: string, toolCalls: AgentToolCall[] }
    | { status: AgentYieldStatus.DONE, agentRunId: string, output: unknown }
    | { status: AgentYieldStatus.FAILED, agentRunId: string, errorMessage: string, partialOutput?: unknown }
    | { status: AgentYieldStatus.TIMEOUT, agentRunId: string, errorMessage: string, partialOutput?: unknown }

export type ResolveAiProviderRequest = {
    engineToken: string
    provider: AIProviderName
}

export type ReportAiUsageRequest = {
    engineToken: string
    event: AiUsageEvent
}

/**
 * Worker→API RPC requests backing the agent's worker-native knowledge-base and flow tools. The worker
 * has no HTTP client to the internal API (it talks to the API only over Socket.IO RPC), so these
 * operations — which the AI piece used to make as in-sandbox HTTP calls — are exposed as RPC methods.
 * Each carries the `engineToken`; the API derives the trusted `projectId` from it (same isolation as
 * every other engine-token route) before touching project-scoped data.
 */
export type ListKnowledgeChunksRequest = {
    engineToken: string
    knowledgeBaseFileId: string
    embedded?: boolean
}

export type AgentKnowledgeChunk = {
    id: string
    content: string
    chunkIndex: number
}

export type StoreKnowledgeChunksRequest = {
    engineToken: string
    knowledgeBaseFileId: string
    chunks: { id: string, embedding: number[] }[]
}

export type SearchKnowledgeRequest = {
    engineToken: string
    knowledgeBaseFileIds: string[]
    queryEmbedding: number[]
    limit: number
    similarityThreshold?: number
}

export type KnowledgeSearchResult = {
    id: string
    content: string
    metadata: Record<string, unknown>
    chunkIndex: number
    score: number
}

export type GetTableSchemaRequest = {
    engineToken: string
    tableId: string
}

export type AgentTableField = {
    id: string
    name: string
    type: string
}

export type GetTableSchemaResponse = {
    id: string
    name: string
    fields: AgentTableField[]
}

export type ListTableRecordsRequest = {
    engineToken: string
    tableId: string
    filters: Filter[]
    limit: number
}

export type ListTableRecordsResponse = {
    records: unknown[]
}

export type ListPopulatedFlowsRequest = {
    engineToken: string
    externalIds: string[]
}

/**
 * Invokes another flow's webhook as an agent flow tool. The AI piece used to POST to the public
 * `v1/webhooks/:flowId[/sync]` URL from the sandbox; on the worker (no HTTP client to the API) this
 * is an RPC whose API handler runs `webhookService.handleWebhook` in-process. `async` mirrors the
 * trigger's `returnsResponse` (false → wait for the run via `/sync`; true → fire-and-acknowledge).
 */
export type InvokeFlowToolRequest = {
    engineToken: string
    flowId: string
    async: boolean
    inputs: Record<string, unknown>
}

export type InvokeFlowToolResponse = {
    status: number
    body: unknown
}

export type ListPopulatedFlowsResponse = SeekPage<PopulatedFlow>
