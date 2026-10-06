export enum AgentEventType {
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
    SUBAGENT_PROGRESS = 'SUBAGENT_PROGRESS',
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
    taskTitle?: string
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
    iconName?: string
    projectId?: string
    phase: BuildPlanPhase
    steps: BuildPlanStep[]
    updatedAt: string
}

export type SubagentLink = {
    url: string
    title?: string
}

export type SubagentTimelineEntry =
    | { kind: 'status', text: string }
    | { kind: 'search', query: string, results: SubagentLink[] }
    | { kind: 'read', url: string, title?: string }

export type SubagentActivity = {
    taskId?: string
    title: string
    status: 'running' | 'done' | 'blocked' | 'failed'
    statusLine?: string
    timeline?: SubagentTimelineEntry[]
    stepCount: number
    pieces?: string[]
    artifacts?: { type: string, id: string, name: string }[]
    needs?: string
    summary?: string
    startedAt: string
    durationMs?: number
}

export const subagentProgressId = {
    forSubject: ({ toolCallId, index }: { toolCallId: string, index: number }): string => `${toolCallId}:${index}`,
    baseOf: (progressId: string): string => progressId.split(':')[0],
}

export type SubagentProgressEvent = {
    toolCallId: string
    data: SubagentActivity
}

export type AgentEvent =
    | { type: AgentEventType.CHUNK, data: unknown }
    | { type: AgentEventType.FINISHED, data: { conversationId: string } }
    | { type: AgentEventType.ERROR, data: { message: string, code?: string } }
    | { type: AgentEventType.TITLE_UPDATE, data: { title: string } }
    | { type: AgentEventType.TOOL_PROGRESS, data: ToolProgressEvent }
    | { type: AgentEventType.ACTION_PREVIEW, data: ActionPreviewEvent }
    | { type: AgentEventType.ACTION_RECEIPT, data: ActionReceiptEvent }
    | { type: AgentEventType.IMAGE, data: ImageGeneratedEvent }
    | { type: AgentEventType.FILE, data: FileProducedEvent }
    | { type: AgentEventType.BUILD_PLAN, data: BuildPlanEvent }
    | { type: AgentEventType.SUBAGENT_PROGRESS, data: SubagentProgressEvent }
