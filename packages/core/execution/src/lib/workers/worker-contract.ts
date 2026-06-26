import { StreamStepProgress } from '../engine/engine-operation'
import { GetFlowVersionForWorkerRequest, UploadRunLogsRequest } from '../engine/requests'
import { FlowRun, RunEnvironment } from '../flow-run/flow-run'
import { FlowVersion } from '../flows/flow-version'
import { ChatAgentEvent } from './chat-agent-events'
import { ChatPromptOverride } from './job-data'
import { ConsumeJobRequest, ConsumeJobResponse, WorkerMachineHealthcheckRequest } from './index'

export type SubmitPayloadsRequest = {
    flowVersionId: string
    projectId: string
    payloads: unknown[]
    httpRequestId?: string
    environment: RunEnvironment
    streamStepProgress: StreamStepProgress
    parentRunId?: string
    failParentOnFailure?: boolean
}

export type SavePayloadRequest = {
    flowId: string
    flowVersionId: string
    projectId: string
    payloads: unknown[]
}

export type GetPieceRequest = {
    name: string
    version?: string
    projectId?: string
    platformId?: string
}

export type GetFlowBundleRequest = {
    flowVersionId: string
    projectId: string
}

export type GetFlowBundleResponse =
    | { kind: 'inline', data: Buffer }
    | { kind: 'url', url: string }

export type PrepareFlowBundleUploadRequest = {
    flowVersionId: string
    projectId: string
    platformId: string
    size: number
}

export type PrepareFlowBundleUploadResponse =
    | { kind: 'url', url: string }
    | { kind: 'inline' }
    | { kind: 'skip' }

export type UploadFlowBundleRequest = {
    flowVersionId: string
    projectId: string
    platformId: string
    data: Buffer
}

export type WorkerToApiContract = {
    poll(input: WorkerMachineHealthcheckRequest): Promise<ConsumeJobRequest | null>
    completeJob(input: ConsumeJobResponse & { jobId: string, token: string, queueName: string }): Promise<void>
    uploadRunLog(input: UploadRunLogsRequest): Promise<void>
    submitPayloads(input: SubmitPayloadsRequest): Promise<FlowRun[]>
    savePayloads(input: SavePayloadRequest): Promise<void>
    getFlowVersion(input: GetFlowVersionForWorkerRequest): Promise<FlowVersion | null>
    getPiece(input: GetPieceRequest): Promise<unknown>
    getPieceArchive(input: { archiveId: string }): Promise<Buffer>
    getFlowBundle(input: GetFlowBundleRequest): Promise<GetFlowBundleResponse | null>
    prepareFlowBundleUpload(input: PrepareFlowBundleUploadRequest): Promise<PrepareFlowBundleUploadResponse>
    uploadFlowBundle(input: UploadFlowBundleRequest): Promise<void>
    extendLock(input: { jobId: string, token: string, queueName: string }): Promise<void>
    disableFlow(input: DisableFlowRequest): Promise<void>
    sendChatEvent(input: SendChatEventRequest): Promise<void>
    getChatConfig(input: GetChatConfigRequest): Promise<ChatConfigResponse>
    saveChatMessages(input: SaveChatMessagesRequest): Promise<void>
    updateChatProgress(input: UpdateChatProgressRequest): Promise<void>
    updateProjectContext(input: UpdateProjectContextRequest): Promise<void>
    executeChatTool(input: ExecuteChatToolRequest): Promise<ExecuteChatToolResponse>
}

export type SendChatEventRequest = {
    userId: string
    conversationId: string
    runId?: string
    event: ChatAgentEvent
}

export type GetChatConfigRequest = {
    conversationId: string
    runId?: string
    platformId: string
    userId: string
    userMessage: string
    modelName: string | null
    files?: Array<{ name: string, mimeType: string, data: string }>
    promptOverride?: ChatPromptOverride
    dryRun?: boolean
}

export type ChatConfigResponse = {
    provider: string
    auth: Record<string, unknown>
    providerConfig: Record<string, unknown>
    modelId: string
    systemPrompt: string
    messages: unknown[]
    allMessages: unknown[]
    previousUiMessages: unknown[]
    tier: { id: string, thinkingBudget: number, modelId: string }
    mcpCredentials: { mcpServerUrl: string, mcpToken: string } | null
    projects: Array<{ id: string, displayName: string, type: string }>
    guides: Record<string, string>
}

export type SaveChatMessagesRequest = {
    conversationId: string
    messages: unknown[]
    uiMessages: unknown[]
    title?: string
    modelName?: string
}

export type UpdateChatProgressRequest = {
    conversationId: string
    uiMessages: unknown[]
}

export type UpdateProjectContextRequest = {
    conversationId: string
    projectId: string | null
}

export type ExecuteChatToolRequest = {
    toolName: string
    toolInput: Record<string, unknown>
    platformId: string
    userId: string
    conversationId?: string
}

export type ExecuteChatToolResponse = {
    result: unknown
}

export type DisableFlowRequest = {
    flowId: string
    projectId: string
}
