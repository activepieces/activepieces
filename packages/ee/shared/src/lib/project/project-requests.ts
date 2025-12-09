import { Metadata, Nullable, PiecesFilterType, ProjectIcon, ProjectType, SAFE_STRING_PATTERN } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'

export const UpdateProjectPlatformRequest = Type.Object({
    releasesEnabled: Type.Optional(Type.Boolean()),
    displayName: Type.Optional(Type.String({
        pattern: SAFE_STRING_PATTERN,
    })),
    externalId: Type.Optional(Type.String()),
    metadata: Type.Optional(Metadata),
    icon: Type.Optional(ProjectIcon),
    plan: Type.Optional(Type.Object({
        pieces: Type.Optional(Type.Array(Type.String({}))),
        piecesFilterType: Type.Optional(Type.Enum(PiecesFilterType)),
    })),
})

export type UpdateProjectPlatformRequest = Static<typeof UpdateProjectPlatformRequest>

export const CreatePlatformProjectRequest = Type.Object({
    displayName: Type.String({
        pattern: SAFE_STRING_PATTERN,
    }),
    externalId: Nullable(Type.String()),
    metadata: Nullable(Metadata),
    maxConcurrentJobs: Nullable(Type.Number()),
})

export type CreatePlatformProjectRequest = Static<typeof CreatePlatformProjectRequest>

export const ListProjectRequestForPlatformQueryParams = Type.Object({
    externalId: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Number({})),
    cursor: Type.Optional(Type.String({})),
    displayName: Type.Optional(Type.String()),
    types: Type.Optional(Type.Array(Type.Enum(ProjectType))),
})

export type ListProjectRequestForPlatformQueryParams = Static<typeof ListProjectRequestForPlatformQueryParams>