import { Static, Type } from '@sinclair/typebox'
import { Nullable } from '../common'

export enum ProjectReleaseType {
    GIT = 'GIT',
    PROJECT = 'PROJECT',
    ROLLBACK = 'ROLLBACK',
}

const BaseProjectReleaseRequestBody = Type.Object({
    name: Type.String(),
    description: Nullable(Type.String()),
    selectedFlowsIds: Type.Array(Type.String()),
})

export const CreateProjectReleaseFromGitRequestBody = Type.Composite([
    BaseProjectReleaseRequestBody,
    Type.Object({
        repoId: Type.String(),
        type: Type.Literal(ProjectReleaseType.GIT),
    }),
])

export const CreateProjectReleaseFromRollbackRequestBody = Type.Composite([
    BaseProjectReleaseRequestBody,
    Type.Object({
        type: Type.Literal(ProjectReleaseType.ROLLBACK),
        projectReleaseId: Type.String(),
    }),
])

export const CreateProjectReleaseFromProjectRequestBody = Type.Composite([
    BaseProjectReleaseRequestBody,
    Type.Object({
        type: Type.Literal(ProjectReleaseType.PROJECT),
        targetProjectId: Type.String(),
    }),
])

export const CreateProjectReleaseRequestBody = Type.Union([
    CreateProjectReleaseFromGitRequestBody,
    CreateProjectReleaseFromRollbackRequestBody,
    CreateProjectReleaseFromProjectRequestBody,
])

export type CreateProjectReleaseRequestBody = Static<typeof CreateProjectReleaseRequestBody>


export const DiffReleaseRequest = Type.Union([
    Type.Object({
        type: Type.Literal(ProjectReleaseType.PROJECT),
        targetProjectId: Type.String(),
    }),
    Type.Object({
        type: Type.Literal(ProjectReleaseType.ROLLBACK),
        projectReleaseId: Type.String(),
    }),
    Type.Object({
        type: Type.Literal(ProjectReleaseType.GIT),
    }),
])

export type DiffReleaseRequest = Static<typeof DiffReleaseRequest>

export const ListProjectReleasesRequest = Type.Object({
    cursor: Nullable(Type.String()),
    limit: Type.Optional(Type.Number({ default: 10 })),
})

export type ListProjectReleasesRequest = Static<typeof ListProjectReleasesRequest>