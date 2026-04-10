import { ApId, ExecutionType, FlowRunStatus, PauseType, ProgressUpdateType, RespondResponse } from '@activepieces/shared'

enum WaitpointStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
}

type WaitpointResumePayload = {
    payload?: {
        body?: unknown
        headers?: Record<string, string>
        queryParams?: Record<string, string>
    }
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
    type: `${PauseType}`
    status: WaitpointStatus
    stepName: string
    resumeDateTime: string | null
    timeoutSeconds: number | null
    responseToSend: RespondResponse | null
    workerHandlerId: string | null
    httpRequestId: string | null
    resumePayload: WaitpointResumePayload | null
}

type CreateForPauseParams = {
    flowRunId: ApId
    projectId: ApId
    stepName: string
    type: `${PauseType}`
    resumeDateTime?: string
    timeoutSeconds?: number
    responseToSend?: RespondResponse
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

export { WaitpointStatus }
export type { Waitpoint, WaitpointResumePayload, CreateForPauseParams, CreateForPauseResult, CompleteParams, CompleteResult, HandleResumeSignalParams }
