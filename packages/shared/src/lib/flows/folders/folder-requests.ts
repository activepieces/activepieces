import { Static, Type } from '@sinclair/typebox'
import { Cursor } from '../../common/seek-page'

export const CreateFolderRequest = Type.Object({
    displayName: Type.String(),
    projectId: Type.String(),
})

export type CreateFolderRequest = Static<typeof CreateFolderRequest>

export const UpdateFolderRequest = Type.Object({
    displayName: Type.String(),
})

export type UpdateFolderRequest = Static<typeof UpdateFolderRequest>


export const DeleteFolderRequest = Type.Object({
    id: Type.String(),
})

export type DeleteFlowRequest = Static<typeof DeleteFolderRequest>

export const ListFolderRequest = Type.Object({
    limit: Type.Optional(Type.Number({})),
    cursor: Type.Optional(Type.String({})),
    projectId: Type.String(),
})

export type ListFolderRequest = Omit<Static<typeof ListFolderRequest>, 'cursor'> & { cursor: Cursor | undefined }