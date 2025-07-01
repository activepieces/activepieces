import { api } from '@/lib/api';
import {
  CreateSubscriptionParams,
  EnableAiCreditUsageParams,
  UpdateSubscriptionParams,
} from '@activepieces/ee-shared';
import { PlatformPlan, PlatformBillingInformation } from '@activepieces/shared';

export const platformBillingApi = {
  getSubscriptionInfo() {
    return api.get<PlatformBillingInformation>('/v1/platform-billing/info');
  },
  getPortalLink() {
    return api.post<string>('/v1/platform-billing/portal');
  },
  updateSubscription(params: UpdateSubscriptionParams) {
    return api.post<string>('/v1/platform-billing/update-subscription', params);
  },
  createSubscription(params: CreateSubscriptionParams) {
    return api.post<string>('/v1/platform-billing/create-subscription', params);
  },
  setAiCreditUsageLimit(params: EnableAiCreditUsageParams) {
    return api.post<PlatformPlan>(
      '/v1/platform-billing/set-ai-credit-usage-limit',
      params,
    );
  },
};
