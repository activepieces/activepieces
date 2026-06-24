import {
  UpdateActiveFlowsAddonParams,
  CreateSubscriptionParams,
  CreateAICreditCheckoutSessionParamsSchema,
  UpdateAICreditsAutoTopUpParamsSchema,
  PlatformBillingInformation,
  PurchasablePlan,
  CheckoutPlanParams,
  CheckoutSessionResponse,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const platformBillingApi = {
  getSubscriptionInfo() {
    return api.get<PlatformBillingInformation>('/v1/platform-billing/info');
  },
  listPlans() {
    return api.get<PurchasablePlan[]>('/v1/platform-billing/plans');
  },
  checkout(params: CheckoutPlanParams) {
    return api.post<CheckoutSessionResponse>(
      '/v1/platform-billing/checkout',
      params,
    );
  },
  getPortalLink() {
    return api.post<string>('/v1/platform-billing/portal');
  },
  updateActiveFlowsLimits(params: UpdateActiveFlowsAddonParams) {
    return api.post<string>(
      '/v1/platform-billing/update-active-flows-addon',
      params,
    );
  },
  createSubscription(params: CreateSubscriptionParams) {
    return api.post<string>(
      '/v1/platform-billing/create-checkout-session',
      params,
    );
  },
  createAICreditCheckoutSession(
    params: CreateAICreditCheckoutSessionParamsSchema,
  ) {
    return api.post<{ stripeCheckoutUrl: string }>(
      '/v1/platform-billing/ai-credits/create-checkout-session',
      params,
    );
  },
  updateAutoTopUp(params: UpdateAICreditsAutoTopUpParamsSchema) {
    return api.post<{ stripeCheckoutUrl?: string }>(
      '/v1/platform-billing/ai-credits/auto-topup',
      params,
    );
  },
};
