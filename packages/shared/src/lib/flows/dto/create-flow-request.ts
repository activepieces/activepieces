import { Static, Type } from '@sinclair/typebox'
import { Metadata } from '../../common/metadata'

export const CreateFlowRequest = Type.Object({
    displayName: Type.String({}),
    /**If folderId is provided, folderName is ignored */
    folderId: Type.Optional(Type.String({})),
    folderName: Type.Optional(Type.String({})),
    projectId: Type.String({}),
    metadata: Type.Optional(Metadata),
})

export type CreateFlowRequest = Static<typeof CreateFlowRequest>
