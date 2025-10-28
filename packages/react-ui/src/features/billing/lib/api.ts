import { api } from '@/lib/api';
import {
  ListAICreditsUsageRequest,
  ListAICreditsUsageResponse,
} from '@activepieces/common-ai';
import {
  CreateSubscriptionParams,
  ToggleAiCreditsOverageEnabledParams,
  SetAiCreditsOverageLimitParams,
  UpdateSubscriptionParams,
  StartTrialParams,
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
      '/v1/platform-billing/update-ai-overage-state',
      params,
    );
  },
  startTrial(params: StartTrialParams) {
    return api.post<{ success: boolean }>(
      '/v1/platform-billing/start-trial',
      params,
    );
  },
  listAiCreditsUsage(
    params: ListAICreditsUsageRequest,
  ): Promise<ListAICreditsUsageResponse> {
    return api.get('/v1/platform-billing/ai-credits-usage', params);
  },
};
