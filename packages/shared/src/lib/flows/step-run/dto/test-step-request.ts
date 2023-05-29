import { Static, Type } from "@sinclair/typebox";

export const CreateStepRunRequestBody = Type.Object({
    flowVersionId: Type.String(),
    stepName: Type.String(),
})

export const CreateStepRunResponse = Type.Object({
    success: Type.Boolean(),
    output: Type.Unknown(),
    standardError: Type.String(),
    standardOutput: Type.String(),
})

export type CreateStepRunResponse = Static<typeof CreateStepRunResponse>