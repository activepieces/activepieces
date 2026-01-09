import { Static, Type } from '@sinclair/typebox'
import { GetStepOutputRequest, TriggerPayload } from '../../engine'
import { StepOutput } from './step-output'

export enum ExecutionType {
    BEGIN = 'BEGIN',
    RESUME = 'RESUME',
}

export type PopulatedExecutionState = {
    steps: Record<string, StepOutput>
}

export const ExecutionState = Type.Object({
    steps: Type.Record(Type.String(), GetStepOutputRequest),
})

export type ExecutionState = Static<typeof ExecutionState>

export type ExecutioOutputFile = {
    executionState: PopulatedExecutionState
}

export type ResumePayload = TriggerPayload
