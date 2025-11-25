import { Static, Type } from '@sinclair/typebox'
import { ProjectType } from './project'


export const ListProjectRequestForUserQueryParams = Type.Object({
    cursor: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Number()),
    displayName: Type.Optional(Type.String()),
    types: Type.Optional(Type.Array(Type.Enum(ProjectType))),
})

export type ListProjectRequestForUserQueryParams = Static<typeof ListProjectRequestForUserQueryParams>