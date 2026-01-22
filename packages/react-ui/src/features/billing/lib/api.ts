import { api } from '@/lib/api';
import {
  UpdateActiveFlowsAddonParams,
  CreateSubscriptionParams,
  CreateAICreditCheckoutSessionParamsSchema,
  UpdateAICreditsAutoTopUpParamsSchema,
} from '@activepieces/ee-shared';
import { PlatformBillingInformation } from '@activepieces/shared';

export const platformBillingApi = {
  getSubscriptionInfo() {
    return api.get<PlatformBillingInformation>('/v1/platform-billing/info');
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
