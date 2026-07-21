import { isNil } from '@activepieces/core-utils';
import { PurchasablePlan } from '@activepieces/shared';
import { t } from 'i18next';

const FREE_PLAN_ID = 'free';
const ANNUAL_INTERVAL = 'year';
const SALES_URL = 'https://activepieces.com/sales';

function cleanName(plan: PurchasablePlan): string {
  return plan.name.replace(/\s*\((annual|monthly|yearly)\)\s*/i, '').trim();
}

function findPurchasablePlan({
  plans,
  key,
  cycle,
}: {
  plans: PurchasablePlan[];
  key: PlanKey;
  cycle: BillingCycle;
}): PurchasablePlan | undefined {
  return plans.find(
    (plan) =>
      cleanName(plan).toLowerCase() === key &&
      (cycle === 'year'
        ? plan.interval === ANNUAL_INTERVAL
        : plan.interval !== ANNUAL_INTERVAL),
  );
}

function computePricing({
  entry,
  apiPlan,
  monthlySibling,
}: {
  entry: PlanCatalogEntry;
  apiPlan?: PurchasablePlan;
  monthlySibling?: PurchasablePlan;
}): PlanPricing | null {
  if (entry.key === 'enterprise') {
    return null;
  }
  if (entry.key === 'free') {
    return { amount: '$0' };
  }
  if (isNil(apiPlan)) {
    return null;
  }
  if (apiPlan.interval !== ANNUAL_INTERVAL) {
    const amount = isNil(apiPlan.price)
      ? apiPlan.priceDisplay ?? ''
      : `$${apiPlan.price}`;
    return { amount, suffix: t('/mo') };
  }
  if (isNil(apiPlan.price)) {
    return { amount: apiPlan.priceDisplay ?? '', suffix: t('/year') };
  }
  const perMonth = Math.round(apiPlan.price / 12);
  const monthlyPrice = monthlySibling?.price;
  const savePercent =
    !isNil(monthlyPrice) && monthlyPrice > 0
      ? Math.round((1 - apiPlan.price / (monthlyPrice * 12)) * 100)
      : null;
  return {
    amount: `$${perMonth.toLocaleString()}`,
    suffix: t('/mo'),
    savePercent: !isNil(savePercent) && savePercent > 0 ? savePercent : null,
    annualNote: t('billed annually ({total}/year)', {
      total: `$${apiPlan.price.toLocaleString()}`,
    }),
  };
}

function actionFor({
  currentPlanId,
}: {
  currentPlanId: string | null | undefined;
}): CheckoutAction {
  if (isNil(currentPlanId) || currentPlanId === FREE_PLAN_ID) {
    return 'create';
  }
  return 'upgrade';
}

function buildSuccessUrl(action: CheckoutAction): string {
  return `${window.location.origin}/platform/setup/billing/success?action=${action}`;
}

const PLAN_CATALOG: PlanCatalogEntry[] = [
  {
    key: 'free',
    name: 'Free',
    blurb:
      'Perfect for individuals who want to explore automation without any commitment.',
    featuresHeader: "What's included:",
    features: [
      { label: '100 credits/day' },
      { label: '1 seat' },
      { label: 'Automation flows' },
      { label: 'Tables' },
      { label: 'API Keys' },
    ],
  },
  {
    key: 'plus',
    name: 'Plus',
    blurb:
      'Built for solo builders who automate regularly and need more credits and advanced tools.',
    featuresHeader: 'Everything in Free, +',
    features: [
      { label: '10,000 credits/mo' },
      { label: '5 seats' },
      { label: 'Agents / Chat' },
      { label: 'Projects, MCPs' },
      { label: 'BYOK' },
      { label: 'Team analytics' },
    ],
  },
  {
    key: 'team',
    name: 'Team',
    highlighted: true,
    blurb:
      'Designed for teams that collaborate on automations and need user management and integrations.',
    featuresHeader: 'Everything in Plus, +',
    features: [
      { label: '50,000 credits/mo' },
      { label: '100 seats' },
      { label: 'SSO' },
      { label: 'Standard roles' },
      { label: 'Global connections' },
      { label: 'Email support' },
    ],
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    blurb:
      'For organizations that require enterprise-grade security, compliance, and dedicated support.',
    featuresHeader: 'Everything in Team, +',
    features: [
      {
        label: 'From 1M credits',
        tooltip:
          'Custom monthly AI credit allotment negotiated for your organization.',
      },
      {
        label: 'SSO + SCIM',
        tooltip:
          'Single sign-on with automated user provisioning and deprovisioning.',
      },
      {
        label: 'Custom RBAC',
        tooltip: 'Define custom roles and granular permissions for your team.',
      },
      {
        label: 'Audit logs',
        tooltip: 'Full activity history across your platform for compliance.',
      },
      {
        label: 'Priority execution',
        tooltip: 'Higher execution priority and dedicated capacity.',
      },
      {
        label: 'White-label',
        tooltip:
          'Fully brand the platform with your own logo, colors, and domain.',
      },
      {
        label: 'Embedding',
        tooltip:
          'Embed Activepieces (flows/chat/connections/tables..etc) directly inside your own product.',
      },
      {
        label: 'Piece management',
        tooltip: 'Control which pieces are available across your platform.',
      },
      {
        label: 'Template management',
        tooltip: 'Curate and manage flow templates for your team.',
      },
      {
        label: 'Dedicated support',
        tooltip: 'A dedicated support contact and onboarding assistance.',
      },
    ],
  },
];

export const planSelectorUtils = {
  findPurchasablePlan,
  computePricing,
  actionFor,
  buildSuccessUrl,
  PLAN_CATALOG,
  FREE_PLAN_ID,
  ANNUAL_INTERVAL,
  SALES_URL,
};

export const DROP_TO_FREE_MESSAGE =
  'This takes effect at the end of your current billing period.';
export const DROP_TO_FREE_WARNING =
  'Your workspace will move to the Free plan and lose its current limits and paid features. You keep your current plan until the period ends.';

export type BillingCycle = 'month' | 'year';
export type CheckoutAction = 'create' | 'upgrade' | 'downgrade';

export type PlanPricing = {
  amount: string;
  suffix?: string;
  savePercent?: number | null;
  annualNote?: string;
};

export type PlanKey = 'free' | 'plus' | 'team' | 'enterprise';

export type PlanFeature = {
  label: string;
  tooltip?: string;
};

export type PlanCatalogEntry = {
  key: PlanKey;
  name: string;
  blurb: string;
  featuresHeader: string;
  features: PlanFeature[];
  highlighted?: boolean;
  fallbackPrice?: string;
};
