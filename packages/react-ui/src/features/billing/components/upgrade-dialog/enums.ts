import { PlanName } from '@activepieces/shared';

export enum ApSubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  TRIALING = 'trialing',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  ANNUAL = 'annual',
}

export type StripePlanName = PlanName.PLUS | PlanName.BUSINESS;

export const PRICE_PER_EXTRA_USER_MAP = {
  [BillingCycle.ANNUAL]: 0,
  [BillingCycle.MONTHLY]: 0,
};

export const PRICE_PER_EXTRA_PROJECT_MAP = {
  [BillingCycle.ANNUAL]: 0,
  [BillingCycle.MONTHLY]: 0,
};
export const PRICE_PER_EXTRA_5_ACTIVE_FLOWS_MAP = {
  [BillingCycle.ANNUAL]: 0,
  [BillingCycle.MONTHLY]: 0,
};
