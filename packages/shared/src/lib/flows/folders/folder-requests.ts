import { Static, Type } from '@sinclair/typebox'
import { Cursor } from '../../common/seek-page'

export const CreateOrRenameFolderRequest = Type.Object({
    displayName: Type.String(),
})

export type CreateOrRenameFolderRequest = Static<typeof CreateOrRenameFolderRequest>

export const DeleteFolderRequest = Type.Object({
    id: Type.String(),
})

export type DeleteFlowRequest = Static<typeof DeleteFolderRequest>

export const ListFolderRequest = Type.Object({
    limit: Type.Optional(Type.Number({})),
    cursor: Type.Optional(Type.String({})),
})

export type ListFolderRequest = Omit<Static<typeof ListFolderRequest>, 'cursor'> & { cursor: Cursor | undefined }
