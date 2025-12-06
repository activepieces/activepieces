import { api } from '@/lib/api';
import {
  ToggleAiCreditsOverageEnabledParams,
  SetAiCreditsOverageLimitParams,
  UpdateActiveFlowsAddonParams,
  CreateSubscriptionParams,
} from '@activepieces/ee-shared';
import { PlatformPlan, PlatformBillingInformation } from '@activepieces/shared';

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
  setAiCreditsOverageLimit(params: SetAiCreditsOverageLimitParams) {
    return api.post<PlatformPlan>(
      '/v1/platform-billing/set-ai-credits-overage-limit',
      params,
    );
  },
  toggleAiCreditsOverageEnabled(params: ToggleAiCreditsOverageEnabledParams) {
    return api.post<PlatformPlan>(
      '/v1/platform-billing/update-ai-overage-state',
      params,
    );
  },
};
