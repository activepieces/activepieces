import { Static, Type } from '@sinclair/typebox'

export const Changelog = Type.Object({
    title: Type.String(),
    markdownContent: Type.String(),
    featuredImage: Type.String(),
    date: Type.String(),
})

export type Changelog = Static<typeof Changelog>