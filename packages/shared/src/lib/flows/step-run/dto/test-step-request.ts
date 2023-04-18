import { Type } from "@sinclair/typebox";

export const CreateStepRunRequestBody = Type.Object({
    collectionId: Type.String(),
    flowVersionId: Type.String(),
    stepName: Type.String(),
})
