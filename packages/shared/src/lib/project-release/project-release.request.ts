import { Static, Type } from '@sinclair/typebox'
import { DiscriminatedUnion, Nullable } from '../common'

export enum ProjectReleaseType {
    PROJECT = 'PROJECT',
    ROLLBACK = 'ROLLBACK',
}

const BaseProjectReleaseRequestBody = {
    name: Type.String(),
    description: Nullable(Type.String()),
    selectedFlowsIds: Nullable(Type.Array(Type.String())),
    projectId: Type.String(),
}

export const CreateProjectReleaseFromRollbackRequestBody = Type.Object({
    type: Type.Literal(ProjectReleaseType.ROLLBACK),
    ...BaseProjectReleaseRequestBody,
    projectReleaseId: Type.String(),
})

export const CreateProjectReleaseFromProjectRequestBody = Type.Object({
    type: Type.Literal(ProjectReleaseType.PROJECT),
    ...BaseProjectReleaseRequestBody,
    targetProjectId: Type.String(),
})

export const CreateProjectReleaseRequestBody = DiscriminatedUnion('type', [
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
])

export type DiffReleaseRequest = Static<typeof DiffReleaseRequest>

export const ListProjectReleasesRequest = Type.Object({
    cursor: Nullable(Type.String()),
    limit: Type.Optional(Type.Number({ default: 10 })),
})

export type ListProjectReleasesRequest = Static<typeof ListProjectReleasesRequest>