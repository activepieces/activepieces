import { Type } from '@sinclair/typebox'
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

export const ExecutionState = Type.Object({
    steps: Type.Record(Type.String(), Type.Unknown()),
    tags: Type.Array(Type.String()),
})

export type ExecutioOutputFile = {
    executionState: ExecutionState
}

export type ResumePayload = TriggerPayload
