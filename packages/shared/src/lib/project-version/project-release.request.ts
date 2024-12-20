import { Static, Type } from '@sinclair/typebox'
import { Nullable } from '../common'

export enum ProjectReleaseType {
    GIT = 'GIT',
}

const BaseProjectReleaseRequestBody = Type.Object({
    name: Type.String(),
    description: Nullable(Type.String()),
})

export const CreateProjectReleaseFromGitRequestBody = Type.Composite([
    BaseProjectReleaseRequestBody,
    Type.Object({
        selectedOperations: Type.Array(Type.String()),
        repoId: Type.String(),
        type: Type.Literal(ProjectReleaseType.GIT),
    }),
])

export const CreateProjectReleaseRequestBody = Type.Union([
    CreateProjectReleaseFromGitRequestBody,
])

export type CreateProjectReleaseRequestBody = Static<typeof CreateProjectReleaseRequestBody>

export const ListProjectReleasesRequest = Type.Object({
    cursor: Nullable(Type.String()),
    limit: Type.Optional(Type.Number({ default: 10 })),
})

export type ListProjectReleasesRequest = Static<typeof ListProjectReleasesRequest>