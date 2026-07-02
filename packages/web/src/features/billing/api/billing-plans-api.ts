import {
  ConsumableProductTopupParams,
  ConsumableProductAutoTopupParams,
  PlatformBillingInformation,
  ProjectCreditUsage,
  PurchasablePlan,
  CheckoutPlanParams,
  CheckoutSessionResponse,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const platformBillingApi = {
  getSubscriptionInfo() {
    return api.get<PlatformBillingInformation>('/v1/platform-billing/info');
  },
  listPlans() {
    return api.get<PurchasablePlan[]>('/v1/platform-billing/plans');
  },
  checkout(params: CheckoutPlanParams) {
    return api.post<CheckoutSessionResponse>(
      '/v1/platform-billing/checkout',
      params,
    );
  },
  getPortalLink() {
    return api.post<string>('/v1/platform-billing/portal');
  },
  cancel() {
    return api.post<void>('/v1/platform-billing/cancel', {});
  },
  reactivate() {
    return api.post<void>('/v1/platform-billing/reactivate', {});
  },
  createConsumableProductTopup(params: ConsumableProductTopupParams) {
    return api.post<{ paymentUrl: string }>(
      '/v1/platform-billing/consumable-product-topups/checkout',
      params,
    );
  },
  updateAutoTopUp(params: ConsumableProductAutoTopupParams) {
    return api.post<{ paymentUrl?: string }>(
      '/v1/platform-billing/consumable-product-topups/auto-topup',
      params,
    );
  },
  getProjectsUsage(params: { startDate?: string; endDate?: string }) {
    return api.get<ProjectCreditUsage[]>(
      '/v1/platform-billing/projects-usage',
      params,
    );
  },
};
