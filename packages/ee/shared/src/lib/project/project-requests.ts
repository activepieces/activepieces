import { Static, Type } from "@sinclair/typebox";
import { NotificationStatus } from "@activepieces/shared";

export const UpdateProjectRequest = Type.Object({
    notifyStatus: Type.Enum(NotificationStatus),
    displayName: Type.String()
})

export type UpdateProjectRequest = Static<typeof UpdateProjectRequest>;

export const CreateProjectRequest = Type.Object({
    displayName: Type.String(),
})

export type CreateProjectRequest = Static<typeof CreateProjectRequest>;

