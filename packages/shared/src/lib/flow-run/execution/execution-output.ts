import { Type } from '@sinclair/typebox'
import { TriggerPayload } from '../../engine'
import { StepOutput } from './step-output'

export enum ExecutionType {
    BEGIN = 'BEGIN',
    RESUME = 'RESUME',
}

export type ExecutionState = {
    steps: Record<string, StepOutput>
}

export const ExecutionState = Type.Object({
    steps: Type.Record(Type.String(), Type.Unknown()),
})

export type ExecutioOutputFile = {
    executionState: ExecutionState
    tasks: number
}

export type ResumePayload = TriggerPayload
