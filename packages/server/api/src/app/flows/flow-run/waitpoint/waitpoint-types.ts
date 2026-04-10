import { ApId, ExecutionType, FlowRunStatus, ProgressUpdateType } from '@activepieces/shared'

enum WaitpointStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
}

enum WaitpointType {
    DELAY = 'DELAY',
    WEBHOOK = 'WEBHOOK',
}

type WaitpointResponseToSend = {
    status?: number
    body?: unknown
    headers?: Record<string, string>
}

type WaitpointResumePayload = {
    payload?: {
        body?: unknown
        headers?: Record<string, string>
        queryParams?: Record<string, string>
    }
    requestId?: string
    workerHandlerId?: string
    progressUpdateType?: ProgressUpdateType
    executionType?: ExecutionType
}

type Waitpoint = {
    id: ApId
    created: string
    updated: string
    flowRunId: ApId
    projectId: ApId
    type: WaitpointType
    status: WaitpointStatus
    resumeDateTime: string | null
    timeoutSeconds: number | null
    responseToSend: WaitpointResponseToSend | null
    workerHandlerId: string | null
    httpRequestId: string | null
    resumePayload: WaitpointResumePayload | null
}

type CreateForPauseParams = {
    flowRunId: ApId
    projectId: ApId
    type: WaitpointType
    resumeDateTime?: string
    timeoutSeconds?: number
    responseToSend?: WaitpointResponseToSend
    workerHandlerId?: string
    httpRequestId?: string
}

type CreateForPauseResult = {
    inserted: boolean
    waitpoint: Waitpoint
}

type CompleteParams = {
    flowRunId: ApId
    projectId: ApId
    resumePayload: WaitpointResumePayload
}

type CompleteResult = {
    completedExisting: boolean
    waitpoint: Waitpoint
}

type HandleResumeSignalParams = {
    flowRunId: ApId
    flowRunStatus: FlowRunStatus
    projectId: ApId
    resumeData: WaitpointResumePayload
    onReady: (waitpoint: Waitpoint, resumeData: WaitpointResumePayload) => Promise<void>
}

export { WaitpointStatus, WaitpointType }
export type { Waitpoint, WaitpointResponseToSend, WaitpointResumePayload, CreateForPauseParams, CreateForPauseResult, CompleteParams, CompleteResult, HandleResumeSignalParams }
