import { ApId, FlowRunStatus, PauseType, RespondResponse } from '@activepieces/shared'

enum WaitpointStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
}

type WaitpointResumePayload = {
    body?: unknown
    headers?: Record<string, string>
    queryParams?: Record<string, string>
} | null

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
    workerHandlerId?: string
}

type CompleteResult = {
    completedExisting: boolean
    waitpoint: Waitpoint
}

type HandleResumeSignalParams = {
    flowRunId: ApId
    flowRunStatus: FlowRunStatus
    projectId: ApId
    resumePayload: WaitpointResumePayload
    workerHandlerId?: string
    onReady: (waitpoint: Waitpoint) => Promise<void>
}

export { WaitpointStatus }
export type { Waitpoint, WaitpointResumePayload, CreateForPauseParams, CreateForPauseResult, CompleteParams, CompleteResult, HandleResumeSignalParams }
