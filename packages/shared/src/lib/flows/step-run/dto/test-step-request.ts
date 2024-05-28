import { Static, Type } from '@sinclair/typebox'
import { Nullable } from '../../../common'
import { ProgressUpdateType } from '../../../engine'
import { FlowRunResponse } from '../../../flow-run/execution/flow-execution'

export const CreateStepRunRequestBody = Type.Object({
    flowVersionId: Type.String(),
    stepName: Type.String(),
    id: Type.String(),
})

export type CreateStepRunRequestBody = Static<typeof CreateStepRunRequestBody>

export const StepRunResponse = Type.Object({
    id: Type.String(),
    success: Type.Boolean(),
    output: Type.Unknown(),
    standardError: Type.String(),
    standardOutput: Type.String(),
})

export type StepRunResponse = Static<typeof StepRunResponse>

export const StepExecutionPath = Type.Array(Type.Tuple([Type.String(), Type.Number()]))
export type StepExecutionPath = Static<typeof StepExecutionPath>

export const UpdateRunProgressRequest = Type.Object({
    runDetails: FlowRunResponse,
    runId: Type.String(),
    progressUpdateType: Type.Enum(ProgressUpdateType),
    workerHandlerId: Nullable(Type.String()),
})

export type UpdateRunProgressRequest = Static<typeof UpdateRunProgressRequest>
