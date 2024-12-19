import { Static, Type } from '@sinclair/typebox'

export enum ProjectReleaseType {
    GIT = 'GIT',
}

const BaseProjectReleaseRequestBody = Type.Object({
    name: Type.String(),
    description: Type.Union([Type.String(), Type.Null()]),
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