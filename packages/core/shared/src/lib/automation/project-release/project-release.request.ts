import { z } from 'zod'
import { Nullable } from '../../core/common'

export enum ProjectReleaseType {
    GIT = 'GIT',
    PROJECT = 'PROJECT',
    ROLLBACK = 'ROLLBACK',
}

const BaseProjectReleaseRequestBody = {
    name: z.string(),
    description: Nullable(z.string()),
    selectedFlowsIds: Nullable(z.array(z.string())),
    projectId: z.string(),
}

export const CreateProjectReleaseFromGitRequestBody = z.object({
    type: z.literal(ProjectReleaseType.GIT),
    ...BaseProjectReleaseRequestBody,
})


export const CreateProjectReleaseFromRollbackRequestBody = z.object({
    type: z.literal(ProjectReleaseType.ROLLBACK),
    ...BaseProjectReleaseRequestBody,
    projectReleaseId: z.string(),
})

export const CreateProjectReleaseFromProjectRequestBody = z.object({
    type: z.literal(ProjectReleaseType.PROJECT),
    ...BaseProjectReleaseRequestBody,
    targetProjectId: z.string(),
})

export const CreateProjectReleaseRequestBody = z.discriminatedUnion('type', [
    CreateProjectReleaseFromRollbackRequestBody,
    CreateProjectReleaseFromProjectRequestBody,
    CreateProjectReleaseFromGitRequestBody,
])

export type CreateProjectReleaseRequestBody = z.infer<typeof CreateProjectReleaseRequestBody>


export const DiffReleaseRequest = z.union([
    z.object({
        projectId: z.string(),
        type: z.literal(ProjectReleaseType.PROJECT),
        targetProjectId: z.string(),
    }),
    z.object({
        projectId: z.string(),
        type: z.literal(ProjectReleaseType.ROLLBACK),
        projectReleaseId: z.string(),
    }),
    z.object({
        projectId: z.string(),
        type: z.literal(ProjectReleaseType.GIT),
    }),
])

export type DiffReleaseRequest = z.infer<typeof DiffReleaseRequest>

export const ListProjectReleasesRequest = z.object({
    projectId: z.string(),
    cursor: z.string().optional(),
    limit: z.coerce.number().default(10).optional(),
})

export type ListProjectReleasesRequest = z.infer<typeof ListProjectReleasesRequest>
