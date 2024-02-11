import { TriggerPayload } from '../../engine'
import { StepOutput } from './step-output'

export const MAX_LOG_SIZE = 2048 * 1024

export enum ExecutionOutputStatus {
    FAILED = 'FAILED',
    QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    PAUSED = 'PAUSED',
    RUNNING = 'RUNNING',
    STOPPED = 'STOPPED',
    SUCCEEDED = 'SUCCEEDED',
    TIMEOUT = 'TIMEOUT',
}

export enum ExecutionType {
    BEGIN = 'BEGIN',
    RESUME = 'RESUME',
}

export type ExecutionError = {
    stepName: string
    errorMessage: string
}


export type ExecutionState = {
    steps: Record<string, StepOutput>
}

type BaseExecutionOutput<T extends ExecutionOutputStatus> = {
    status: T
    executionState: ExecutionState
    duration: number
    tasks: number
    tags?: string[]
    errorMessage?: ExecutionError
}

export enum PauseType {
    DELAY = 'DELAY',
    WEBHOOK = 'WEBHOOK',
}

type BasePauseMetadata<T extends PauseType> = {
    type: T
}

export type DelayPauseMetadata = BasePauseMetadata<PauseType.DELAY> & {
    resumeDateTime: string
}

export type WebhookPauseMetadata = BasePauseMetadata<PauseType.WEBHOOK> & {
    requestId: string
    metadata: Record<string, unknown>
}

export type PauseMetadata = DelayPauseMetadata | WebhookPauseMetadata

export type ResumePayload = {
    payload: TriggerPayload
}

export type PauseExecutionOutput = BaseExecutionOutput<ExecutionOutputStatus.PAUSED> & {
    pauseMetadata: PauseMetadata
}

export type StopResponse = {
    status?: number
    body?: unknown
    headers?: Record<string, string>
}

export type FinishExecutionOutput = BaseExecutionOutput<
Exclude<
ExecutionOutputStatus,
| ExecutionOutputStatus.PAUSED
| ExecutionOutputStatus.STOPPED
>
>

export type StopExecutionOutput = BaseExecutionOutput<ExecutionOutputStatus.STOPPED> & {
    stopResponse?: StopResponse
}

export type ExecutionOutput =
    | FinishExecutionOutput
    | PauseExecutionOutput
    | StopExecutionOutput
