import { api } from '@/lib/api';
import { ProjectBillingResponse } from '@activepieces/ee-shared';

export const billingApi = {
  getSubscription() {
    return api.get<ProjectBillingResponse>('/v1/project-billing');
  },
  portalLink() {
    return api.post<{ portalLink: string }>('/v1/project-billing/portal');
  },
  upgrade() {
    return api.post<{ paymentLink: string }>('/v1/project-billing/upgrade');
  },
};
