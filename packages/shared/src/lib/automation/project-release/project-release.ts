import { z } from 'zod'
import { BaseModelSchema, Nullable } from '../../core/common'
import { UserWithMetaInformation } from '../../core/user'
import { ProjectReleaseType } from './project-release.request'

export const ProjectRelease = z.object({
    ...BaseModelSchema,
    projectId: z.string(),
    name: z.string(),
    description: Nullable(z.string()),
    importedBy: Nullable(z.string()),
    fileId: z.string(),
    type: z.nativeEnum(ProjectReleaseType),
    importedByUser: UserWithMetaInformation.optional(),
})

export type ProjectRelease = z.infer<typeof ProjectRelease>
