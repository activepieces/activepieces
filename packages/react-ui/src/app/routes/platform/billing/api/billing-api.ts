import { api } from '@/lib/api';
import { UpdateSubscriptionParams } from '@activepieces/ee-shared';
import { PlatformPlan, PlatformBillingInformation } from '@activepieces/shared';

export const platformBillingApi = {
  getSubscriptionInfo() {
    return api.get<PlatformBillingInformation>('/v1/platform-billing/info');
  },
  getPortalLink() {
    return api.post<{ portalLink: string }>('/v1/platform-billing/portal');
  },
  upgradePAYG() {
    return api.post<{ paymentLink: string }>('/v1/platform-billing/upgrade');
  },
  updateSubscription(params: UpdateSubscriptionParams) {
    return api.post<PlatformPlan>(
      '/v1/platform-billing/update-subscription',
      params,
    );
  },
  createSubscription(params: UpdateSubscriptionParams) {
    return api.post<string>('/v1/platform-billing/create-subscription', params);
  },
  updateTaskLimit(tasksLimit: number | null | undefined) {
    return api.patch<PlatformPlan>('/v1/platform-billing', {
      tasksLimit,
    });
  },
};
