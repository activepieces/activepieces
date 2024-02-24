import { BaseModelSchema } from "@activepieces/shared";
import { Static, Type } from "@sinclair/typebox";

export const ProjectBilling = Type.Object({
    ...BaseModelSchema,
    projectId: Type.String(),
    includedTasks: Type.Number(),
    includedUsers: Type.Number(),
    stripeCustomerId: Type.String(),
    stripeSubscriptionId: Type.String(),
    subscriptionStartDatetime: Type.String(),
})

export type ProjectBilling = Static<typeof ProjectBilling>

export const ProjectSubscriptionResponse = Type.Object({
    subscription: ProjectBilling
})

export type ProjectSubscriptionResponse = Static<typeof ProjectSubscriptionResponse>