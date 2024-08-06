import { api } from '@/lib/api';

export const billingApi = {
  getSubscription() {
    return api.get<any>('/v1/project-billing');
  },
  portalLink() {
    return api.post<{ portalLink: string }>('/v1/project-billing/portal');
  },
};
