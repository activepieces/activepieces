import { Static, Type } from "@sinclair/typebox";
import { NotificationStatus, PiecesFilterType, SAFE_STRING_PATTERN } from "@activepieces/shared";

export const UpdateProjectPlatformRequest = Type.Object({
    notifyStatus: Type.Optional(Type.Enum(NotificationStatus)),
    displayName: Type.Optional(Type.String({
        pattern: SAFE_STRING_PATTERN,
    })),
    plan: Type.Optional(Type.Object({
        tasks: Type.Optional(Type.Number({})),
        pieces: Type.Optional(Type.Array(Type.String({}))),
        piecesFilterType: Type.Optional(Type.Enum(PiecesFilterType)),
        aiTokens: Type.Optional(Type.Number({})),
    })),
})

export type UpdateProjectPlatformRequest = Static<typeof UpdateProjectPlatformRequest>;

export const CreatePlatformProjectRequest = Type.Object({
    displayName: Type.String({
        pattern: SAFE_STRING_PATTERN,
    }),
    externalId: Type.Optional(Type.String()),
})

export type CreatePlatformProjectRequest = Static<typeof CreatePlatformProjectRequest>;
