import { api } from '@/lib/api';
import { UpgradeSubscriptionParams } from '@activepieces/ee-shared';
import { PlatformPlan, PlatformBillingInformation } from '@activepieces/shared';

export const platformBillingApi = {
  getSubscription() {
    return api.get<PlatformBillingInformation>('/v1/platform-billing/info');
  },
  portalLink() {
    return api.post<{ portalLink: string }>('/v1/platform-billing/portal');
  },
  upgrade(data: UpgradeSubscriptionParams) {
    return api.post<{ paymentLink: string }>(
      '/v1/platform-billing/upgrade',
      data,
    );
  },
  update(tasksLimit: number | null | undefined) {
    return api.patch<PlatformPlan>('/v1/platform-billing', {
      tasksLimit,
    });
  },
};
