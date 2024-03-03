import { TriggerPayload } from '../../engine'
import { PauseMetadata } from './flow-execution'
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
    errorMessage?: ExecutionError
}


export type ResumePayload = TriggerPayload

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
    | StopExecutionOutput
