import { Static, Type } from '@sinclair/typebox'

export const CountFlowsRequest = Type.Object({
    folderId: Type.Optional(Type.String()),
})

export type CountFlowsRequest = Static<typeof CountFlowsRequest>
