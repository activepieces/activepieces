import { Static, Type } from '@sinclair/typebox'

export const CountFlowsRequest = Type.Object({
    projectId: Type.String(),
    folderId: Type.Optional(Type.String()),
})

export type CountFlowsRequest = Static<typeof CountFlowsRequest>
