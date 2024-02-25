import { Static, Type } from "@sinclair/typebox";
import { NotificationStatus } from "@activepieces/shared";

export const UpdateProjectPlatformRequest = Type.Object({
    notifyStatus: Type.Enum(NotificationStatus),
    displayName: Type.String(),
    plan: Type.Optional(Type.Object({
        teamMembers: Type.Optional(Type.Number({})),
        tasks: Type.Number({}),
    })),
})

export type UpdateProjectPlatformRequest = Static<typeof UpdateProjectPlatformRequest>;

export const CreatePlatformProjectRequest = Type.Object({
    displayName: Type.String(),
    externalId: Type.Optional(Type.String()),
})

export type CreatePlatformProjectRequest = Static<typeof CreatePlatformProjectRequest>;
