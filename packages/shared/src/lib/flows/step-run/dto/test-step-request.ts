import { Type } from "@sinclair/typebox";

export const CreateStepRunRequestBody = Type.Object({
    flowVersionId: Type.String(),
    stepName: Type.String(),
})
