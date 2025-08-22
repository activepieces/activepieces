export enum ApSubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  TRIALING = 'trialing',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  ANNUAL = 'annual',
}

export enum PlanName {
  FREE = 'free',
  PLUS = 'plus',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
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
