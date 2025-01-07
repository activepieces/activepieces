import { api } from '@/lib/api';
import { PlatformBillingResponse } from '@activepieces/ee-shared';

export const platformBillingApi = {
  getSubscription() {
    return api.get<PlatformBillingResponse>('/v1/platform-billing/info');
  },
  portalLink() {
    return api.post<{ portalLink: string }>('/v1/platform-billing/portal');
  },
  upgrade() {
    return api.post<{ paymentLink: string }>('/v1/platform-billing/upgrade');
  },
  update(tasksLimit: number | undefined, aiCreditsLimit: number | undefined) {
    return api.patch<{ paymentLink: string }>('/v1/platform-billing', {
      tasksLimit,
      aiCreditsLimit,
    });
  },
};
