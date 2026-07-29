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

export type ConsentEffectPreview = {
    displayName: string
    detail: string
    kind: string
    recipient?: string
    recipientResolved: boolean
}

export type ConsentPreviewCategory =
    | 'live_test'
    | 'step_test'
    | 'retry_run'
    | 'run_code'
    | 'publish'
    | 'enable'
    | 'delete_flow'
    | 'delete_table'
    | 'delete_records'
    | 'delete_column'
    | 'connector_action'
    | 'unknown_tool'

export type ConsentSeverity = 'destructive' | 'financial' | 'external' | 'unknown'

export type ConsentPreview = {
    category: ConsentPreviewCategory
    severity: ConsentSeverity
    flowName?: string
    targetName?: string
    recordCount?: number
    effects: ConsentEffectPreview[]
    resolved: boolean
    reusable: boolean
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
    consent?: ConsentPreview
}

export type ActionReceiptEvent = {
    toolCallId: string
    actionDisplayName: string
    pieceName: string
    connectionLabel?: string
    status: 'success' | 'failed' | 'declined' | 'timed_out'
    output: unknown
    errorMessage?: string
    timestamp: string
    autoApproved?: boolean
    autoReason?: string
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
    iconName?: string
    projectId?: string
    phase: BuildPlanPhase
    steps: BuildPlanStep[]
    updatedAt: string
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
