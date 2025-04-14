import { Static, Type } from '@sinclair/typebox'

export const Changelog = Type.Object({
    title: Type.String(),
    featuredImage: Type.String(),
    date: Type.String(),
})

export type Changelog = Static<typeof Changelog>

export const ListChangelogsResponse = Type.Object({
    data: Type.Array(Changelog),
})

export type ListChangelogsResponse = Static<typeof ListChangelogsResponse>
