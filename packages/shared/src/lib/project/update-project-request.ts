import { Static, Type } from "@sinclair/typebox";

export enum NotificationStatus {
    NEVER = "NEVER",
    ALWAYS = "ALWAYS",
}

export const UpdateProjectRequest = Type.Object({
    notifications: Type.Enum(NotificationStatus),
})

export type UpdateProjectRequest = Static<typeof UpdateProjectRequest>;