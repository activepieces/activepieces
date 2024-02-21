import { Static, Type } from "@sinclair/typebox";
import { ApId, BaseModelSchema } from "@activepieces/shared";

export type ActivityId = ApId

export const Activity = Type.Object({
    ...BaseModelSchema,
    projectId: ApId,
    event: Type.String(),
    message: Type.String(),
    status: Type.String(),
})

export type Activity = Static<typeof Activity>
