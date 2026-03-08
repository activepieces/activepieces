import { z } from 'zod'
import { BaseModelSchema } from '../common/base-model'

export const Tag = z.object({
    ...BaseModelSchema,
    platformId: z.string(),
    name: z.string(),
})

export type Tag = z.infer<typeof Tag>

export const PieceTag = z.object({
    ...BaseModelSchema,
    pieceName: z.string(),
    tagId: z.string(),
    platformId: z.string(),
})

export type PieceTag = z.infer<typeof PieceTag>

export const ListTagsRequest = z.object({
    limit: z.coerce.number().optional(),
    cursor: z.string().optional(),
})

export type ListTagsRequest = z.infer<typeof ListTagsRequest>

export const SetPieceTagsRequest = z.object({
    piecesName: z.array(z.string()),
    tags: z.array(z.string()),
})

export type SetPieceTagsRequest = z.infer<typeof SetPieceTagsRequest>

export const UpsertTagRequest = z.object({
    name: z.string(),
})

export type UpsertTagRequest = z.infer<typeof UpsertTagRequest>
