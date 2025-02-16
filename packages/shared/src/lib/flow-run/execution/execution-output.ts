import { Type } from '@sinclair/typebox'
import { TriggerPayload } from '../../engine'
import { StepOutput } from './step-output'

export enum ExecutionType {
    BEGIN = 'BEGIN',
    RESUME = 'RESUME',
}

export type ExecutionState = {
    steps: Record<string, StepOutput>
    resumePayload?: ResumePayload
}

export const ExecutionState = Type.Object({
    steps: Type.Record(Type.String(), Type.Unknown()),
    resumePayload: Type.Optional(Type.Unknown()),
})

export type ExecutioOutputFile = {
    executionState: ExecutionState
}

export type ResumePayload = TriggerPayload
