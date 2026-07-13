import { StreamStepProgress } from '../engine/engine-operation'
import { GetFlowVersionForWorkerRequest, SendFlowResponseRequest, UpdateRunProgressRequest, UpdateStepProgressRequest, UploadRunLogsRequest } from '../engine/requests'
import { FlowRun, RunEnvironment } from '../flow-run/flow-run'
import { FlowVersion } from '../flows/flow-version'
import { PiecePackage } from '@activepieces/core-piece-types'
import { TriggerRunStatus } from '../flows/triggers/trigger-run'
import { ActiveStageContext, ChatMention, ChatPromptOverride } from './job-data'
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
    updateRunProgress(input: UpdateRunProgressRequest): Promise<void>
    uploadRunLog(input: UploadRunLogsRequest): Promise<void>
    sendFlowResponse(input: SendFlowResponseRequest): Promise<void>
    updateStepProgress(input: UpdateStepProgressRequest): Promise<void>
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
    getUsedPieces(input: Record<string, never>): Promise<PiecePackage[]>
    markPieceAsUsed(input: { pieces: PiecePackage[] }): Promise<void>
    disableFlow(input: DisableFlowRequest): Promise<void>
    sendChatEvent(input: SendChatEventRequest): Promise<void>
    getChatConfig(input: GetChatConfigRequest): Promise<ChatConfigResponse>
    saveChatMessages(input: SaveChatMessagesRequest): Promise<void>
    saveChatFile(input: SaveChatFileRequest): Promise<SaveChatFileResponse>
    updateChatProgress(input: UpdateChatProgressRequest): Promise<void>
    heartbeatChatConversation(input: HeartbeatChatConversationRequest): Promise<void>
    updateProjectContext(input: UpdateProjectContextRequest): Promise<void>
    executeChatTool(input: ExecuteChatToolRequest): Promise<ExecuteChatToolResponse>
    sendChatEmail(input: SendChatEmailRequest): Promise<SendChatEmailResponse>
    getPersonalizationConfig(input: GetPersonalizationConfigRequest): Promise<PersonalizationConfigResponse>
    savePersonalizationResult(input: SavePersonalizationResultRequest): Promise<void>
    sendPersonalizationProgress(input: SendPersonalizationProgressRequest): Promise<void>
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
    ACTION_PREVIEW = 'ACTION_PREVIEW',
    ACTION_RECEIPT = 'ACTION_RECEIPT',
    IMAGE = 'IMAGE',
    FILE = 'FILE',
    BUILD_PLAN = 'BUILD_PLAN',
    STAGE_OPEN = 'STAGE_OPEN',
    BROWSER_VIEW = 'BROWSER_VIEW',
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

export type ImageGeneratedEvent = {
    toolCallId: string
    fileId: string
    url: string
    mediaType: string
    prompt?: string
    model?: string
    caption?: string
    timestamp: string
}

export type FileProducedEvent = {
    toolCallId: string
    fileId: string
    url: string
    mediaType: string
    fileName: string
    byteSize: number
    title?: string
    timestamp: string
}

export type BuildPlanStepStatus = 'pending' | 'in_progress' | 'done' | 'failed'

export type BuildPlanPhase = 'detecting' | 'building' | 'testing' | 'done' | 'failed'

export type BuildPlanStep = {
    id: string
    label: string
    status: BuildPlanStepStatus
}

export type BuildPlanEvent = {
    buildId: string
    flowId?: string
    flowName?: string
    tagline?: string
    outcome?: string
    iconName?: string
    projectId?: string
    phase: BuildPlanPhase
    steps: BuildPlanStep[]
    updatedAt: string
}

export type StageOpenEvent = {
    resourceType: 'flow' | 'table' | 'run'
    resourceId: string
    projectId?: string
    displayName?: string
}

export type BrowserViewEvent = {
    toolCallId: string
    sessionId: string
    liveViewUrl: string
    interactiveLiveViewUrl?: string
    // 'live' = the agent is actively driving it. 'handoff' = the agent's turn ended but the session
    // is still alive and INTERACTIVE, waiting for the human to clear a wall in the browser (login /
    // 2FA / CAPTCHA / final submit). 'idle' = parked between turns (agent paused, no human wall), the
    // session is still alive and resumable on the next message. 'closed' = the session ended for good.
    status: 'live' | 'handoff' | 'idle' | 'closed'
    interactive: boolean
    displayName?: string
    finalScreenshot?: string
}

export type ChatAgentEvent =
    | { type: ChatAgentEventType.CHUNK, data: unknown }
    | { type: ChatAgentEventType.FINISHED, data: { conversationId: string } }
    | { type: ChatAgentEventType.ERROR, data: { message: string, code?: string } }
    | { type: ChatAgentEventType.TITLE_UPDATE, data: { title: string } }
    | { type: ChatAgentEventType.TOOL_PROGRESS, data: ToolProgressEvent }
    | { type: ChatAgentEventType.ACTION_PREVIEW, data: ActionPreviewEvent }
    | { type: ChatAgentEventType.ACTION_RECEIPT, data: ActionReceiptEvent }
    | { type: ChatAgentEventType.IMAGE, data: ImageGeneratedEvent }
    | { type: ChatAgentEventType.FILE, data: FileProducedEvent }
    | { type: ChatAgentEventType.BUILD_PLAN, data: BuildPlanEvent }
    | { type: ChatAgentEventType.STAGE_OPEN, data: StageOpenEvent }
    | { type: ChatAgentEventType.BROWSER_VIEW, data: BrowserViewEvent }

export type GetChatConfigRequest = {
    conversationId: string
    runId?: string
    platformId: string
    userId: string
    userMessage: string
    modelName: string | null
    files?: Array<{ name: string, mimeType: string, data: string }>
    mentions?: ChatMention[]
    promptOverride?: ChatPromptOverride
    activeContext?: ActiveStageContext
    source?: 'suggestion'
    dryRun?: boolean
}

export type ResolvedAiToolConfig = {
    provider: string
    apiKey: string
    config?: Record<string, unknown>
}

export type ChatAiToolsConfig = {
    webSearch?: ResolvedAiToolConfig
    webScraping?: ResolvedAiToolConfig
    imageGeneration?: ResolvedAiToolConfig
}

export type ChatConfigResponse = {
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
    aiTools: ChatAiToolsConfig
    emailEnabled: boolean
    userEmail: string
    // 'NORMAL' | 'REFERRAL' (ChatMode). The worker uses this to scope the tool set: a REFERRAL
    // conversation is a locked-down "Refer & earn" chat that gets only the referral tools.
    chatMode: string
    // toolName -> the arg holding the resource id ('tableId' | 'flowId'). The worker announces
    // the Stage AI lock (which gates realtime deltas) for exactly these tools. Derived on the API
    // from each tool's permission + id arg so the worker never hand-maintains a drifting name list.
    mutatingResourceTools: Record<string, string>
    // Set when this turn's user message matched a referral phrase (verified redemption or the
    // inviter saying their own phrase). The worker prepends an ap_show_referral_celebration
    // tool-call part so the frontend plays the celebration show instantly, before the LLM text.
    referralCelebration?: ReferralCelebrationConfig
}

export type ReferralCelebrationConfig = {
    outcome: 'released' | 'self_referral'
    phrase: string
    amountUsd?: number
    // A signed, cross-user-readable URL to the hero scene generated at mint (the phrase depicted as a
    // real illustration). Absent for pre-feature phrases / gen failures → the frontend shows a
    // tasteful gradient fallback.
    heroImageUrl?: string
}

export type SaveChatMessagesRequest = {
    conversationId: string
    runId?: string
    messages: unknown[]
    uiMessages: unknown[]
    title?: string
    modelName?: string
}

export type SaveChatFileRequest = {
    platformId: string
    projectId?: string
    conversationId: string
    data: Buffer
    mediaType: string
    fileName?: string
}

export type SaveChatFileResponse = {
    fileId: string
    url: string
}

export type UpdateChatProgressRequest = {
    conversationId: string
    runId?: string
    uiMessages: unknown[]
    messages?: unknown[]
}

export type HeartbeatChatConversationRequest = {
    conversationId: string
    runId?: string
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

export type SendChatEmailRequest = {
    conversationId: string
    runId?: string
    platformId: string
    userId: string
    to: string[]
    subject: string
    body: string
    gateId?: string
}

export type SendChatEmailResponse = {
    sent: boolean
    message: string
    blockedRecipients?: string[]
}

export type DisableFlowRequest = {
    flowId: string
    projectId: string
}

// Chat-personalization research RPCs. Profile/use-case payloads stay loosely
// typed here because core-execution cannot import the shared ee/chat zod
// models; the API validates them with PersonalizationProfile on save.
export type PersonalizationScope = 'company' | 'user'

export type GetPersonalizationConfigRequest = {
    platformId: string
    userId: string
    scope: PersonalizationScope
}

export type PersonalizationConfigResponse = {
    // false = another job owns the row (CAS claim lost); the worker exits silently.
    claimed: boolean
    provider: string
    auth: Record<string, unknown>
    providerConfig: Record<string, unknown>
    modelId: string
    fastModelId: string
    user: { firstName: string, lastName: string, email: string }
    platformName: string
    website: string | null
    // The role the user typed during onboarding — authoritative over enrichment.
    role: string | null
    companyProfile: Record<string, unknown> | null
    // Apollo-style people/company enrichment credentials when the platform has
    // the ENRICHMENT AI capability configured.
    enrichment: { provider: string, apiKey: string } | null
    // Direct web-search credentials (Tavily) when the platform has the
    // WEB_SEARCH AI capability configured — powers the parallel research
    // queries that keep personalization deep AND fast.
    webSearch: { provider: string, apiKey: string } | null
}

export type PersonalizationUseCaseResult = {
    id: string
    title: string
    prompt: string
    imageId: string
    app?: string
    kind?: 'mission' | 'routine'
}

export type SavePersonalizationResultRequest = {
    platformId: string
    userId: string
    scope: PersonalizationScope
    status: 'READY' | 'FAILED'
    profile: Record<string, unknown> | null
    useCases: PersonalizationUseCaseResult[] | null
    placeholderPlatformName: string | null
}

export type SendPersonalizationProgressRequest = {
    platformId: string
    userId: string
    scope: PersonalizationScope
    phase: string
    message: string
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
