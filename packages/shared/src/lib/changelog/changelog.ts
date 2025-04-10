import { Static, Type } from '@sinclair/typebox'

export const Changelog = Type.Object({
    results: Type.Array(Type.Unknown()),
    page: Type.Number(),
    limit: Type.Number(),
    totalPages: Type.Number(),
    totalResults: Type.Number(),
})

export type Changelog = Static<typeof Changelog>
