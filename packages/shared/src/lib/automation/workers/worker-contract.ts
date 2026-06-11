import { StreamStepProgress } from '../engine/engine-operation'
import { GetFlowVersionForWorkerRequest, SendFlowResponseRequest, UpdateRunProgressRequest, UpdateStepProgressRequest, UploadRunLogsRequest } from '../engine/requests'
import { FlowRun, RunEnvironment } from '../flow-run/flow-run'
import { FlowVersion } from '../flows/flow-version'
import { PiecePackage } from '../pieces/piece'
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

export type WorkerToApiContract = {
    poll(input: WorkerMachineHealthcheckRequest): Promise<ConsumeJobRequest | null>
    completeJob(input: ConsumeJobResponse & { jobId: string, token: string, queueName: string }): Promise<void>
    updateRunProgress(input: UpdateRunProgressRequest): Promise<void>
    uploadRunLog(input: UploadRunLogsRequest): Promise<void>
    sendFlowResponse(input: SendFlowResponseRequest): Promise<void>
    updateStepProgress(input: UpdateStepProgressRequest): Promise<void>
    submitPayloads(input: SubmitPayloadsRequest): Promise<FlowRun[]>
    savePayloads(input: SavePayloadRequest): Promise<void>
    getFlowVersion(input: GetFlowVersionForWorkerRequest): Promise<FlowVersion | null>
    getPiece(input: GetPieceRequest): Promise<unknown>
    getPieceArchive(input: { archiveId: string }): Promise<Buffer>
    extendLock(input: { jobId: string, token: string, queueName: string }): Promise<void>
    getUsedPieces(input: Record<string, never>): Promise<PiecePackage[]>
    markPieceAsUsed(input: { pieces: PiecePackage[] }): Promise<void>
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

export enum ChatAgentEventType {
    CHUNK = 'CHUNK',
    FINISHED = 'FINISHED',
    ERROR = 'ERROR',
    TITLE_UPDATE = 'TITLE_UPDATE',
    TOOL_PROGRESS = 'TOOL_PROGRESS',
    TOOL_APPROVAL_REQUEST = 'TOOL_APPROVAL_REQUEST',
    ACTION_PREVIEW = 'ACTION_PREVIEW',
    ACTION_RECEIPT = 'ACTION_RECEIPT',
}

export type ToolProgressEvent = {
    toolCallId: string
    data: {
        label: string
        total: number
        completed: number
        succeeded: number
        failed: number
        done: boolean
        results: { index: number, success: boolean, output?: unknown, error?: string }[]
    }
}

export type ToolApprovalRequestEvent = {
    toolCallId: string
    toolName: string
    displayName: string
}

export type ActionPreviewEvent = {
    toolCallId: string
    pieceName: string
    actionName: string
    actionDisplayName: string
    connectionLabel?: string
    input: Record<string, unknown>
    isBatch: boolean
    batchCount?: number
    batchSamples?: Record<string, unknown>[]
}

export type ActionReceiptEvent = {
    toolCallId: string
    actionDisplayName: string
    pieceName: string
    connectionLabel?: string
    status: 'success' | 'failed'
    output: unknown
    errorMessage?: string
    timestamp: string
}

export type ChatAgentEvent =
    | { type: ChatAgentEventType.CHUNK, data: unknown }
    | { type: ChatAgentEventType.FINISHED, data: { conversationId: string } }
    | { type: ChatAgentEventType.ERROR, data: { message: string, code?: string } }
    | { type: ChatAgentEventType.TITLE_UPDATE, data: { title: string } }
    | { type: ChatAgentEventType.TOOL_PROGRESS, data: ToolProgressEvent }
    | { type: ChatAgentEventType.TOOL_APPROVAL_REQUEST, data: ToolApprovalRequestEvent }
    | { type: ChatAgentEventType.ACTION_PREVIEW, data: ActionPreviewEvent }
    | { type: ChatAgentEventType.ACTION_RECEIPT, data: ActionReceiptEvent }

export type GetChatConfigRequest = {
    conversationId: string
    runId?: string
    platformId: string
    userId: string
    userMessage: string
    modelName: string | null
    files?: Array<{ name: string, mimeType: string, data: string }>
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
