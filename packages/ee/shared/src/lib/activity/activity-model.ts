import { Static, Type } from "@sinclair/typebox";
import { ApId, BaseModelSchema } from "@activepieces/shared";

export type ActivityId = ApId

export const ACTIVITY_EVENT_LENGTH = 200
export const ACTIVITY_MESSAGE_LENGTH = 2000
export const ACTIVITY_STATUS_LENGTH = 100

export const Activity = Type.Object({
    ...BaseModelSchema,
    projectId: ApId,
    event: Type.String({ maxLength: ACTIVITY_EVENT_LENGTH }),
    message: Type.String({ maxLength: ACTIVITY_MESSAGE_LENGTH }),
    status: Type.String({ maxLength: ACTIVITY_STATUS_LENGTH }),
})

export type Activity = Static<typeof Activity>
