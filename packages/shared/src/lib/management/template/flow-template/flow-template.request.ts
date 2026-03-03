import { Static, Type } from '@sinclair/typebox'


export const GetFlowTemplateRequestQuery = Type.Object({
    versionId: Type.Optional(Type.String()),
})

export type GetFlowTemplateRequestQuery = Static<typeof GetFlowTemplateRequestQuery>

