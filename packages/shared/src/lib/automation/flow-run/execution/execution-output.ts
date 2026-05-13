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

export type ExecutioOutputFile = {
    executionState: ExecutionState
    version?: number
}

export type ResumePayload = TriggerPayload
