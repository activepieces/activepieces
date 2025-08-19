import { Metadata, NotificationStatus, Nullable, PiecesFilterType, SAFE_STRING_PATTERN } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'

export const UpdateProjectPlatformRequest = Type.Object({
    notifyStatus: Type.Optional(Type.Enum(NotificationStatus)),
    releasesEnabled: Type.Optional(Type.Boolean()),
    displayName: Type.Optional(Type.String({
        pattern: SAFE_STRING_PATTERN,
    })),
    externalId: Type.Optional(Type.String()),
    metadata: Type.Optional(Metadata),
    plan: Type.Optional(Type.Object({
        tasks: Type.Optional(Type.Number({})),
        pieces: Type.Optional(Type.Array(Type.String({}))),
        piecesFilterType: Type.Optional(Type.Enum(PiecesFilterType)),
        aiCredits: Type.Optional(Type.Number({})),
    })),
})

export type UpdateProjectPlatformRequest = Static<typeof UpdateProjectPlatformRequest>

export const CreatePlatformProjectRequest = Type.Object({
    displayName: Type.String({
        pattern: SAFE_STRING_PATTERN,
    }),
    externalId: Nullable(Type.String()),
    metadata: Nullable(Metadata),
})

export type CreatePlatformProjectRequest = Static<typeof CreatePlatformProjectRequest>
