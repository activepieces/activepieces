import { BaseModelSchema } from "@activepieces/shared";
import { Static, Type } from "@sinclair/typebox";

export const PlatformBilling = Type.Object({
  ...BaseModelSchema,
  platformId: Type.String(),
  includedTasks: Type.Number(),
  includedAiCredits: Type.Number(),
  tasksLimit: Type.Optional(Type.Number()),
  aiCreditsLimit: Type.Optional(Type.Number()),
  stripeCustomerId: Type.String(),
  stripeSubscriptionId: Type.String(),
  stripeSubscriptionStatus: Type.String(),
})

export type PlatformBilling = Static<typeof PlatformBilling>
export const PlatformBillingResponse = Type.Object({
  nextBillingDate: Type.String(),
  subscription: PlatformBilling,
  flowRunCount: Type.Number(),
  aiCredits: Type.Number(),
})

export type PlatformBillingResponse = Static<typeof PlatformBillingResponse>