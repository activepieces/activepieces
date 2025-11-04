import { Static, Type } from '@sinclair/typebox'

export const CreateMCPServerFromStepParams = Type.Object({
    flowId: Type.String(),
    flowVersionId: Type.String(),
    stepName: Type.String(),
})
export type CreateMCPServerFromStepParams = Static<typeof CreateMCPServerFromStepParams>