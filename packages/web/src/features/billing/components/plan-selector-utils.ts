import { isNil } from '@activepieces/core-utils';
import { PurchasablePlan } from '@activepieces/shared';
import { t } from 'i18next';

import { formatUtils } from '@/lib/format-utils';

const FREE_PLAN_ID = 'free';
const ANNUAL_INTERVAL = 'year';
const SALES_URL = 'https://www.activepieces.com/sales?ap_cta=app_plan_selector';

function stripPlanInterval(name: string): string {
  return name.replace(/\s*\((annual|monthly|yearly)\)\s*/i, '').trim();
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
      stripPlanInterval(plan.name).toLowerCase() === key &&
      (cycle === 'year'
        ? plan.interval === ANNUAL_INTERVAL
        : plan.interval !== ANNUAL_INTERVAL),
  );
}

function computePricing({
  entry,
  apiPlan,
}: {
  entry: PlanCatalogEntry;
  apiPlan?: PurchasablePlan;
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
    return { amount, note: t('flat per month, billed monthly') };
  }
  if (isNil(apiPlan.price)) {
    return { amount: apiPlan.priceDisplay ?? '', suffix: t('/year') };
  }
  const perMonth = Math.floor(apiPlan.price / 12);
  return {
    amount: `$${perMonth.toLocaleString()}`,
    note: t('flat per month, billed yearly'),
  };
}

function creditTopUpFeature(apiPlan?: PurchasablePlan): PlanFeature[] {
  if (isNil(apiPlan?.creditTopUp)) {
    return [];
  }
  return [
    {
      label: t('Auto recharge: {price} per {credits} credits', {
        price: `$${apiPlan.creditTopUp.price.toLocaleString()}`,
        credits: formatUtils.formatNumberCompact(apiPlan.creditTopUp.credits),
      }),
      tooltip: t(
        'When your credits run out, auto recharge buys more at this price. It stays off until you turn it on.',
      ),
    },
  ];
}

function annualSavedMonths(plans: PurchasablePlan[]): number | null {
  const savedMonths = planCatalog().flatMap((entry) => {
    const annualPrice = findPurchasablePlan({
      plans,
      key: entry.key,
      cycle: 'year',
    })?.price;
    const monthlyPrice = findPurchasablePlan({
      plans,
      key: entry.key,
      cycle: 'month',
    })?.price;
    if (isNil(annualPrice) || isNil(monthlyPrice) || monthlyPrice <= 0) {
      return [];
    }
    return [Math.round(12 - annualPrice / monthlyPrice)];
  });
  const mostSaved = Math.max(0, ...savedMonths);
  return mostSaved >= 1 ? mostSaved : null;
}

function creditsLabel({
  credits,
  interval,
}: {
  credits: number;
  interval: string | null | undefined;
}): string {
  const amount = credits.toLocaleString();
  switch (interval) {
    case 'day':
      return t('{amount} credits/day', { amount });
    case 'month':
      return t('{amount} credits/mo', { amount });
    case 'year':
      return t('{amount} credits/yr', { amount });
    default:
      return t('{amount} credits', { amount });
  }
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
  return `${window.location.origin}/platform/billing/success?action=${action}`;
}

function dropToFreeWarning(additionalSeats: number | null | undefined): string {
  const base = t(DROP_TO_FREE_WARNING);
  if (isNil(additionalSeats) || additionalSeats <= 0) {
    return base;
  }
  return `${base} ${t(
    'Your {count, plural, =1 {1 additional seat} other {# additional seats}} will be removed and the unused time credited back.',
    { count: additionalSeats },
  )}`;
}

function planCatalog(): PlanCatalogEntry[] {
  return [
    {
      key: 'free',
      name: t('Free'),
      blurb: t(
        'Perfect for individuals who want to explore automation without any commitment.',
      ),
      featuresHeader: t('What you get'),
      features: [
        {
          label: t('1,000 credits a month'),
          tooltip: t(
            'A fresh 1,000 credits every month, so there is always room to build and test. One credit runs a whole flow.',
          ),
        },
        {
          label: t('Unlimited flows'),
          tooltip: t(
            'Build as many automations as you want. We never cap the number of flows.',
          ),
        },
        {
          label: t('Up to 5 users'),
          tooltip: t(
            'Invite up to five teammates to build and run automations together.',
          ),
        },
        {
          label: t('Chat to automation'),
          tooltip: t(
            'Chat with your tools and turn the boring work into automations. Still rolling out, so chat may not be on your account yet.',
          ),
        },
        {
          label: t('Flows, Agents, Tables'),
          tooltip: t(
            'Build visual Flows, add Agents and Chat, and keep your data in Tables.',
          ),
        },
        {
          label: t('MCPs and API access'),
          tooltip: t(
            'Serve your tools to any AI assistant over MCP, and manage Activepieces from your own code over the API.',
          ),
        },
      ],
    },
    {
      key: 'plus',
      name: t('Plus'),
      blurb: t(
        'Built for solo builders who automate regularly and need more credits and advanced tools.',
      ),
      featuresHeader: t('Everything in Free, plus'),
      features: [
        {
          label: t('10× the Free plan'),
          tooltip: t(
            '10,000 credits a month, ten times what the Free plan gets.',
          ),
        },
        {
          label: t('Up to 5 users'),
          tooltip: t(
            'Invite up to five teammates to build and run automations together.',
          ),
        },
        {
          label: t('Bring your own AI keys'),
          tooltip: t(
            'Connect your own AI provider keys and every AI step costs 1 credit. The model cost goes to your AI provider, not to your credits.',
          ),
        },
      ],
    },
    {
      key: 'team',
      name: t('Team'),
      highlighted: true,
      blurb: t(
        'Designed for teams that collaborate on automations and need user management and integrations.',
      ),
      featuresHeader: t('Everything in Plus, plus'),
      features: [
        {
          label: t('5× the Plus plan'),
          tooltip: t(
            '50,000 credits a month, five times what the Plus plan gets.',
          ),
        },
        {
          label: t('Unlimited projects'),
          tooltip: t(
            'Projects start on Team: separate workspaces for teams, clients, or environments, and you can create as many as you need.',
          ),
        },
        {
          label: t('25 users included'),
          tooltip: t(
            'The price is flat, not per seat: twenty-five people for one price.',
          ),
        },
        {
          label: t('SSO and standard roles'),
          tooltip: t(
            'Single sign-on plus built-in roles to control who can do what.',
          ),
        },
        {
          label: t('Global connections'),
          tooltip: t(
            'Shared service-account connections available to every project.',
          ),
        },
        {
          label: t('Email support'),
          tooltip: t('Reach our team by email whenever you need a hand.'),
        },
      ],
    },
    {
      key: 'enterprise',
      name: t('Enterprise'),
      blurb: t(
        'For organizations that require enterprise-grade security, compliance, and dedicated support.',
      ),
      featuresHeader: t('Everything in Team, plus'),
      features: [
        {
          label: t('Credits sized to you, yearly'),
          tooltip: t(
            'Your allowance runs across the whole year, so a heavy month is covered by a quiet month, and we size the volume to how you run.',
          ),
        },
        {
          label: t('Dedicated workers'),
          tooltip: t(
            'Your own isolated workers on cloud, not shared with anyone else.',
          ),
        },
        {
          label: t('Execution priority'),
          tooltip: t(
            'Set execution priority per project, so the flows that matter run first.',
          ),
        },
        {
          label: t('SCIM and custom roles'),
          tooltip: t(
            'Provision users automatically and define exactly what each role is allowed to do.',
          ),
        },
        {
          label: t('Releases and Git Sync'),
          tooltip: t(
            'Promote changes across environments and keep every flow versioned in your own Git repo.',
          ),
        },
        {
          label: t('Audit logs and secrets'),
          tooltip: t(
            'Track every action, connect your own secret manager, and govern the whole platform centrally.',
          ),
        },
        {
          label: t('Dedicated support'),
          tooltip: t('A dedicated contact and priority help from our team.'),
        },
      ],
    },
  ];
}

export const planSelectorUtils = {
  stripPlanInterval,
  findPurchasablePlan,
  computePricing,
  annualSavedMonths,
  creditsLabel,
  dropToFreeWarning,
  actionFor,
  buildSuccessUrl,
  planCatalog,
  creditTopUpFeature,
  FREE_PLAN_ID,
  ANNUAL_INTERVAL,
  SALES_URL,
};

export const DROP_TO_FREE_WARNING =
  'Your workspace will move to the Free plan and lose its current limits and paid features. You keep your current plan until the period ends.';

export type BillingCycle = 'month' | 'year';
export type CheckoutAction = 'create' | 'upgrade' | 'downgrade';

export type PlanPricing = {
  amount: string;
  suffix?: string;
  note?: string;
};

export type PlanKey = 'free' | 'plus' | 'team' | 'enterprise';

export type PlanFeature = {
  label: string;
  tooltip: string;
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
