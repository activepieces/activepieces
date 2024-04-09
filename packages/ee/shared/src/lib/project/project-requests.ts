import { Static, Type } from "@sinclair/typebox";
import { NotificationStatus, PiecesFilterType } from "@activepieces/shared";

export const UpdateProjectPlatformRequest = Type.Object({
    notifyStatus: Type.Optional(Type.Enum(NotificationStatus)),
    displayName: Type.Optional(Type.String()),
    plan: Type.Optional(Type.Object({
        teamMembers: Type.Optional(Type.Number({})),
        tasks: Type.Optional(Type.Number({})),
        pieces: Type.Optional(Type.Array(Type.String({}))),
        piecesFilterType: Type.Optional(Type.Enum(PiecesFilterType)),
    })),
})

export type UpdateProjectPlatformRequest = Static<typeof UpdateProjectPlatformRequest>;

export const CreatePlatformProjectRequest = Type.Object({
    displayName: Type.String(),
    externalId: Type.Optional(Type.String()),
})

export type CreatePlatformProjectRequest = Static<typeof CreatePlatformProjectRequest>;
