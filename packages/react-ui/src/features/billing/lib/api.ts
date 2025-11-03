import { api } from '@/lib/api';
import {
  ListAICreditsUsageRequest,
  ListAICreditsUsageResponse,
} from '@activepieces/common-ai';
import {
  ToggleAiCreditsOverageEnabledParams,
  SetAiCreditsOverageLimitParams,
} from '@activepieces/ee-shared';
import { PlatformPlan, PlatformBillingInformation } from '@activepieces/shared';

export const platformBillingApi = {
  getSubscriptionInfo() {
    return api.get<PlatformBillingInformation>('/v1/platform-billing/info');
  },
  getPortalLink() {
    return api.post<string>('/v1/platform-billing/portal');
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
  listAiCreditsUsage(
    params: ListAICreditsUsageRequest,
  ): Promise<ListAICreditsUsageResponse> {
    return api.get('/v1/platform-billing/ai-credits-usage', params);
  },
};
