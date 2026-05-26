import { z } from 'zod'
import { Nullable, OptionalArrayFromQuery } from '../../core/common/base-model'
import { Metadata } from '../../core/common/metadata'
import { SAFE_STRING_PATTERN } from '../../core/common/security'
import { PiecesFilterType, ProjectIcon, ProjectType } from './project'

export const UpdateProjectPlatformRequest = z.object({
    releasesEnabled: z.boolean().optional(),
    displayName: z.string().regex(new RegExp(SAFE_STRING_PATTERN)).optional(),
    externalId: z.string().optional(),
    metadata: Metadata.optional(),
    icon: ProjectIcon.optional(),
    plan: z.object({
        pieces: z.array(z.string()).optional(),
        piecesFilterType: z.nativeEnum(PiecesFilterType).optional(),
    }).optional(),
    globalConnectionExternalIds: z.array(z.string()).optional(),
    maxConcurrentJobs: Nullable(z.number().int().positive()).optional(),
})

export type UpdateProjectPlatformRequest = z.infer<typeof UpdateProjectPlatformRequest>

export const CreatePlatformProjectRequest = z.object({
    displayName: z.string().regex(new RegExp(SAFE_STRING_PATTERN)),
    externalId: Nullable(z.string()),
    metadata: Nullable(Metadata),
    maxConcurrentJobs: Nullable(z.number()),
    globalConnectionExternalIds: z.array(z.string()).optional(),
    alertReceiverEmail: z.email().nullable().optional(),
})

export type CreatePlatformProjectRequest = z.infer<typeof CreatePlatformProjectRequest>

export const ListProjectRequestForPlatformQueryParams = z.object({
    externalId: z.string().optional(),
    externalUserId: z.string().optional(),
    limit: z.coerce.number().optional(),
    cursor: z.string().optional(),
    displayName: z.string().optional(),
    types: OptionalArrayFromQuery(z.nativeEnum(ProjectType)),
})

export type ListProjectRequestForPlatformQueryParams = z.infer<typeof ListProjectRequestForPlatformQueryParams>
