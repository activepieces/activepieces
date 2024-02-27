import { BaseModelSchema } from "@activepieces/shared";
import { Static, Type } from "@sinclair/typebox";

export enum ApSubscriptionStatus {
    ACTIVE = 'active',
    INCOMPLETE = 'incomplete',
    INCOMPLETE_EXPIRED = 'incomplete_expired',
    PAST_DUE = 'past_due',
    CANCELED = 'canceled',
    UNAPID = 'unpaid',
}

export const ProjectBilling = Type.Object({
    ...BaseModelSchema,
    projectId: Type.String(),
    includedTasks: Type.Number(),
    includedUsers: Type.Number(),
    stripeCustomerId: Type.String(),
    stripeSubscriptionId: Type.String(),
    subscriptionStatus: Type.Enum(ApSubscriptionStatus),
})

export type ProjectBilling = Static<typeof ProjectBilling>


export const ProjectBillingRespone = Type.Object({
    nextBillingDate: Type.String(),
    subscription: ProjectBilling
})

export type ProjectBillingRespone = Static<typeof ProjectBillingRespone>