import { t } from 'i18next';

import { BillingCycle, PlanName } from '@activepieces/ee-shared';

export const ANNUAL_DISCOUNT_PERCENTAGE = 0.24;
export const MAX_SEATS = 20;
export const DEFAULT_SEATS = 5;
export const MAX_ACTIVE_FLOWS = {
  [PlanName.BUSINESS]: 100,
  [PlanName.PLUS]: 40,
};
export const DEFAULT_ACTIVE_FLOWS = {
  [PlanName.BUSINESS]: 50,
  [PlanName.PLUS]: 10,
};
export const MAX_PROJECTS = 30;
export const DEFAULT_PROJECTS = 10;

export const ADDON_PRICES = {
  USER_SEAT: {
    [BillingCycle.MONTHLY]: 15,
    [BillingCycle.ANNUAL]: 11.4,
  },
  ACTIVE_FLOWS: {
    [BillingCycle.MONTHLY]: 15,
    [BillingCycle.ANNUAL]: 11.4,
  },
  PROJECT: {
    [BillingCycle.MONTHLY]: 10,
    [BillingCycle.ANNUAL]: 7.6,
  },
};

export const planData = {
  plans: [
    {
      name: PlanName.FREE,
      description: t('Explorers & Tinkers'),
      featuresTitle: t('Get started with'),
      price: {
        [BillingCycle.MONTHLY]: 0,
        [BillingCycle.ANNUAL]: 0,
      },
    },
    {
      name: PlanName.PLUS,
      description: t('Standard Users'),
      featuresTitle: t('Everything in Free, and'),
      price: {
        [BillingCycle.MONTHLY]: 25,
        [BillingCycle.ANNUAL]: 19,
      },
    },
    {
      name: PlanName.BUSINESS,
      description: t('Power Users & Small Teams'),
      featuresTitle: t('Everything in Plus, and'),
      price: {
        [BillingCycle.MONTHLY]: 150,
        [BillingCycle.ANNUAL]: 114,
      },
    },
  ],

  features: [
    {
      key: 'tasks',
      label: t('Tasks'),
      values: {
        free: '1,000/mo',
        plus: 'Unlimited',
        business: 'Unlimited',
      },
    },
    {
      key: 'activeFlows',
      label: t('Active Flows'),
      values: {
        free: '2',
        plus: '10',
        business: '50',
      },
    },
    {
      key: 'agents',
      label: t('AI Agents'),
      values: {
        free: null,
        plus: 'Unlimited',
        business: 'Unlimited',
      },
    },
    {
      key: 'users',
      label: t('Users'),
      values: {
        free: null,
        plus: null,
        business: '5+',
      },
    },
    {
      key: 'projects',
      label: t('Projects'),
      values: {
        free: null,
        plus: null,
        business: '10',
      },
    },
    {
      key: 'aiCredits',
      label: t('AI Credits'),
      values: {
        free: '200',
        plus: '500+',
        business: '1,000+',
      },
    },
    {
      key: 'mcpServers',
      label: t('MCP Servers'),
      values: {
        free: '1',
        plus: 'Unlimited',
        business: null,
      },
    },
    {
      key: 'tables',
      label: t('Tables'),
      values: {
        free: '1',
        plus: 'Unlimited',
        business: null,
      },
    },
    {
      key: 'humanInLoop',
      label: t('Human in the Loop'),
      values: {
        free: null,
        plus: true,
        business: true,
      },
    },
    {
      key: 'apiAccess',
      label: t('API Access'),
      values: {
        free: null,
        plus: null,
        business: true,
      },
    },
    {
      key: 'sso',
      label: t('SSO'),
      values: {
        free: null,
        plus: null,
        business: true,
      },
    },
    {
      key: 'analytics',
      label: t('Analytics'),
      values: {
        free: null,
        plus: null,
        business: true,
      },
    },
  ],
};
