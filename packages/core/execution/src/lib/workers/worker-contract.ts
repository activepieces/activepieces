import { AIProviderName } from '@activepieces/core-utils'
import { AgentPieceToolMetadata } from '@activepieces/core-piece-types'
import { StreamStepProgress } from '../engine/engine-operation'
import { GetFlowVersionForWorkerRequest, UploadRunLogsRequest } from '../engine/requests'
import { FlowRun, RunEnvironment } from '../flow-run/flow-run'
import { FlowVersion } from '../flows/flow-version'
import { TriggerRunStatus } from '../flows/triggers/trigger-run'
import { AgentEvent } from './agent-events'
import { AgentPromptOverride, AgentRunSource } from './job-data'
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

export type RecordTriggerRunRequest = {
    platformId: string
    pieceName: string
    status: TriggerRunStatus
}

export type WorkerToApiContract = {
    poll(input: WorkerMachineHealthcheckRequest): Promise<ConsumeJobRequest | null>
    completeJob(input: ConsumeJobResponse & { jobId: string, token: string, queueName: string }): Promise<void>
    uploadRunLog(input: UploadRunLogsRequest): Promise<void>
    submitPayloads(input: SubmitPayloadsRequest): Promise<FlowRun[]>
    savePayloads(input: SavePayloadRequest): Promise<void>
    getFlowVersion(input: GetFlowVersionForWorkerRequest): Promise<FlowVersion | null>
    getPiece(input: GetPieceRequest): Promise<unknown>
    getPrewarmData(input: PrewarmDataRequest): Promise<PrewarmDataResponse>
    getPieceArchive(input: { archiveId: string }): Promise<Buffer>
    getFlowBundle(input: GetFlowBundleRequest): Promise<GetFlowBundleResponse | null>
    prepareFlowBundleUpload(input: PrepareFlowBundleUploadRequest): Promise<PrepareFlowBundleUploadResponse>
    uploadFlowBundle(input: UploadFlowBundleRequest): Promise<void>
    recordTriggerRun(input: RecordTriggerRunRequest): Promise<void>
    extendLock(input: { jobId: string, token: string, queueName: string }): Promise<void>
    disableFlow(input: DisableFlowRequest): Promise<void>
    sendAgentEvent(input: SendAgentEventRequest): Promise<void>
    getAgentConfig(input: GetAgentConfigRequest): Promise<AgentConfigResponse>
    saveAgentMessages(input: SaveAgentMessagesRequest): Promise<void>
    saveAgentFile(input: SaveAgentFileRequest): Promise<SaveAgentFileResponse>
    updateAgentProgress(input: UpdateAgentProgressRequest): Promise<void>
    heartbeatAgentConversation(input: HeartbeatAgentConversationRequest): Promise<void>
    updateProjectContext(input: UpdateProjectContextRequest): Promise<void>
    executeAgentTool(input: ExecuteAgentToolRequest): Promise<ExecuteAgentToolResponse>
    resumeFlowStep(input: ResumeFlowStepRequest): Promise<void>
    updateFlowStepProgress(input: UpdateFlowStepProgressRequest): Promise<void>
    executePieceTool(input: ExecutePieceToolRequest): Promise<ExecutePieceToolResponse>
    executeKnowledgeBaseTool(input: ExecuteKnowledgeBaseToolRequest): Promise<ExecuteKnowledgeBaseToolResponse>
    executeFlowTool(input: ExecuteFlowToolRequest): Promise<ExecuteFlowToolResponse>
    sendAgentEmail(input: SendAgentEmailRequest): Promise<SendAgentEmailResponse>
}

export type SendAgentEventRequest = {
    userId: string
    conversationId: string
    runId?: string
    event: AgentEvent
}

export type GetAgentConfigRequest = {
    provider?: AIProviderName
    conversationId: string
    runId?: string
    platformId: string
    userId: string
    source?: AgentRunSource
    projectId?: string | null
    userMessage: string
    modelName: string | null
    files?: Array<{ name: string, mimeType: string, data: string }>
    promptOverride?: AgentPromptOverride
    dryRun?: boolean
}

export type ResolvedAiToolConfig = {
    provider: string
    apiKey: string
    config?: Record<string, unknown>
}

export type AgentAiToolsConfig = {
    webSearch?: ResolvedAiToolConfig
    webScraping?: ResolvedAiToolConfig
    imageGeneration?: ResolvedAiToolConfig
}

export type AgentConfigResponse = {
    provider: string
    auth: Record<string, unknown>
    providerConfig: Record<string, unknown>
    modelId: string
    fastModelId: string
    systemPrompt: string
    messages: unknown[]
    allMessages: unknown[]
    previousUiMessages: unknown[]
    tier: { id: string, thinkingBudget: number, modelId: string }
    mcpCredentials: { mcpServerUrl: string, mcpToken: string } | null
    projects: Array<{ id: string, displayName: string, type: string }>
    guides: Record<string, string>
    aiTools: AgentAiToolsConfig
    emailEnabled: boolean
    userEmail: string
    source: AgentRunSource
}

export type SaveAgentMessagesRequest = {
    conversationId: string
    runId?: string
    messages: unknown[]
    uiMessages: unknown[]
    title?: string
    modelName?: string
}

export type SaveAgentFileRequest = {
    platformId: string
    projectId?: string
    conversationId: string
    data: Buffer
    mediaType: string
    fileName?: string
}

export type SaveAgentFileResponse = {
    fileId: string
    url: string
}

export type UpdateAgentProgressRequest = {
    conversationId: string
    runId?: string
    uiMessages: unknown[]
    messages?: unknown[]
}

export type HeartbeatAgentConversationRequest = {
    conversationId: string
    runId?: string
}

export type UpdateProjectContextRequest = {
    conversationId: string
    runId?: string
    projectId: string | null
}

export type ExecuteAgentToolRequest = {
    toolName: string
    toolInput: Record<string, unknown>
    platformId: string
    userId: string
    source: AgentRunSource
    conversationId?: string
}

export type ExecutePieceToolRequest = {
    conversationId: string
    toolName: string
    instruction: string
    provider?: AIProviderName
    piece: AgentPieceToolMetadata
}

export type ExecutePieceToolResponse = {
    result: unknown
}

export type ExecuteKnowledgeBaseToolRequest = {
    conversationId: string
    toolName: string
    provider?: AIProviderName
    knowledgeBaseFileId: string
    query: string
}

export type ExecuteKnowledgeBaseToolResponse = {
    result: unknown
}

export type ExecuteFlowToolRequest = {
    conversationId: string
    toolName: string
    flowId: string
    toolInput: Record<string, unknown>
    returnsResponse: boolean
}

export type ExecuteFlowToolResponse = {
    result: unknown
}

export type UpdateFlowStepProgressRequest = {
    conversationId: string
    flowRunId: string
    output: unknown
    sequence: number
}

export type ResumeFlowStepRequest = {
    conversationId: string
    flowRunId: string
    waitpointId: string
    output: unknown
}

export type ExecuteAgentToolResponse = {
    result: unknown
}

export type SendAgentEmailRequest = {
    conversationId: string
    runId?: string
    platformId: string
    userId: string
    to: string[]
    subject: string
    body: string
    gateId?: string
}

export type SendAgentEmailResponse = {
    sent: boolean
    message: string
    blockedRecipients?: string[]
}

export type DisableFlowRequest = {
    flowId: string
    projectId: string
}

export type PrewarmDataRequest = {
    workerGroupId: string | undefined
    projectWorker: boolean | undefined
    flow?: { id: string, versionId: string, projectId: string }
}

export type PrewarmDataResponse = {
    flows: { id: string, versionId: string, projectId: string }[]
    platformId: string
    engineToken: string
}

export type ApiToWorkerContract = {
    flowPublished(input: { flowId: string, flowVersionId: string, projectId: string }): void
}
