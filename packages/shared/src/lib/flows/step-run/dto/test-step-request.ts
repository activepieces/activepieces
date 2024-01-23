import { Static, Type } from '@sinclair/typebox'

export const CreateStepRunRequestBody = Type.Object({
    flowVersionId: Type.String(),
    stepName: Type.String(),
})

export const StepRunResponse = Type.Object({
    success: Type.Boolean(),
    output: Type.Unknown(),
    standardError: Type.String(),
    standardOutput: Type.String(),
})

export type StepRunResponse = Static<typeof StepRunResponse>