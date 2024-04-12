import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common/base-model'

export const Tag = Type.Object({
    ...BaseModelSchema,
    platformId: Type.String(),
    name: Type.String(),
})

export type Tag = Static<typeof Tag>

export const PieceTag = Type.Object({
    ...BaseModelSchema,
    pieceName: Type.String(),
    tagId: Type.String(),
    platformId: Type.String(),
})

export type PieceTag = Static<typeof PieceTag>

export const ListTagsRequest = Type.Object({
    platformId: Type.String(),
    limit: Type.Optional(Type.Number()),
    cursor: Type.Optional(Type.String()),
})

export type ListTagsRequest = Static<typeof ListTagsRequest>

export const SetPieceTagsRequest = Type.Object({
    piecesName: Type.Array(Type.String()),
    tags: Type.Array(Type.String()),
})

export type SetPieceTagsRequest = Static<typeof SetPieceTagsRequest>

export const UpsertTagRequest = Type.Object({
    name: Type.String(),
})

export type UpsertTagRequest = Static<typeof UpsertTagRequest>
