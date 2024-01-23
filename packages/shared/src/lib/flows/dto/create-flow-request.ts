import { Static, Type } from '@sinclair/typebox'

export const CreateFlowRequest = Type.Object({
    displayName: Type.String({}),
    folderId: Type.Optional(Type.String({})),
    projectId: Type.String({}),
})

export type CreateFlowRequest = Static<typeof CreateFlowRequest>
