import { api } from '@/lib/api';
import {
  CreateSubscriptionParams,
  ToggleAiCreditsOverageEnabledParams,
  SetAiCreditsOverageLimitParams,
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
  setAiCreditsOverageLimit(params: SetAiCreditsOverageLimitParams) {
    return api.post<PlatformPlan>(
      '/v1/platform-billing/set-ai-credits-overage-limit',
      params,
    );
  },
  toggleAiCreditsOverageEnabled(params: ToggleAiCreditsOverageEnabledParams) {
    return api.post<PlatformPlan>(
      '/v1/platform-billing/toggle-ai-credist-overage-enabled',
      params,
    );
  },
  startTrial() {
    return api.post<{ success: boolean }>('/v1/platform-billing/start-trial');
  },
};
