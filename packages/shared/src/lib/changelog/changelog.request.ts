import { Static, Type } from '@sinclair/typebox'
import { Changelog } from './changelog'

export const DismissChangelogRequest = Type.Object({
    date: Type.String(),
})
export type DismissChangelogRequest = Static<typeof DismissChangelogRequest>

export const ListChangelogsResponse = Type.Object({
    data: Type.Array(Changelog),
})
export type ListChangelogsResponse = Static<typeof ListChangelogsResponse>
