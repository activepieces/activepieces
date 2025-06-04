import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../../common'

export type FolderId = string

export const Folder = Type.Object({
    ...BaseModelSchema,
    id: Type.String(),
    projectId: Type.String(),
    displayName: Type.String(),
    displayOrder: Type.Number(),
})

export const UncategorizedFolderId = 'UNCATEGORIZED'
export type Folder = Static<typeof Folder>

export type FolderDto = Folder & { numberOfFlows: number }

