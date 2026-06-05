import { z } from 'zod'
import { TriggerPayload } from '../../engine'
import { StepOutput } from './step-output'

export enum ExecutionType {
    BEGIN = 'BEGIN',
    RESUME = 'RESUME',
}

export type ExecutionState = {
    steps: Record<string, StepOutput>
    tags: string[]
}

export const ExecutionState = z.object({
    steps: z.record(z.string(), z.unknown()),
    tags: z.array(z.string()),
})

export enum RunInternalErrorSource {
    ENGINE = 'ENGINE',
    WORKER = 'WORKER',
}

export const RunInternalError = z.object({
    source: z.enum(RunInternalErrorSource),
    message: z.string(),
    code: z.string().optional(),
    occurredAt: z.string(),
})

export type RunInternalError = z.infer<typeof RunInternalError>

export type ExecutioOutputFile = {
    executionState: ExecutionState
    internalError?: RunInternalError
    version?: number
}

export type ResumePayload = TriggerPayload
