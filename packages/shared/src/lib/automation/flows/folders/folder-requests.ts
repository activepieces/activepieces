import { z } from 'zod'
import { Cursor } from '../../../core/common/seek-page'

export const CreateFolderRequest = z.object({
    displayName: z.string(),
    projectId: z.string(),
})

export type CreateFolderRequest = z.infer<typeof CreateFolderRequest>

export const UpdateFolderRequest = z.object({
    displayName: z.string(),
})

export type UpdateFolderRequest = z.infer<typeof UpdateFolderRequest>


export const DeleteFolderRequest = z.object({
    id: z.string(),
})

export type DeleteFlowRequest = z.infer<typeof DeleteFolderRequest>

export const ListFolderRequest = z.object({
    limit: z.coerce.number().optional(),
    cursor: z.string().optional(),
    projectId: z.string(),
})

export type ListFolderRequest = Omit<z.infer<typeof ListFolderRequest>, 'cursor'> & { cursor: Cursor | undefined }
