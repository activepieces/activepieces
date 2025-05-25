import { api } from '@/lib/api';
import { PlatformPlan, PlatformPlanResponse } from '@activepieces/shared';

export const platformBillingApi = {
  getSubscription() {
    return api.get<PlatformPlanResponse>('/v1/platform-billing/info');
  },
  portalLink() {
    return api.post<{ portalLink: string }>('/v1/platform-billing/portal');
  },
  upgrade() {
    return api.post<{ paymentLink: string }>('/v1/platform-billing/upgrade');
  },
  update(tasksLimit: number | null | undefined) {
    return api.post<PlatformPlan>('/v1/platform-billing', {
      tasksLimit,
    });
  },
};
