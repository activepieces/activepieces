import { t } from 'i18next';

import { PlanName } from '@activepieces/ee-shared';

export const planData = {
  tabs: [t('Monthly'), t('Annual')],

  plans: [
    {
      name: PlanName.FREE,
      description: t('Explorers & Tinkers'),
      featuresTitle: t('Get started with'),
      price: 0,
    },
    {
      name: PlanName.PLUS,
      description: t('Standard Users'),
      featuresTitle: t('Everything in Free, and'),
      price: 25,
    },
    {
      name: PlanName.BUSINESS,
      description: t('Power Users & Small Teams'),
      featuresTitle: t('Everything in Plus, and'),
      price: 150,
    },
    {
      name: PlanName.ENTERPRISE,
      description: t('Cloud or Self-Hosted'),
      featuresTitle: t('Maximum Capabilities'),
      price: 'Custom',
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
        enterprise: 'Custom',
      },
    },
    {
      key: 'activeFlows',
      label: t('Active Flows'),
      values: {
        free: '2',
        plus: '10',
        business: '50',
        enterprise: 'Custom',
      },
    },
    {
      key: 'agents',
      label: t('AI Agents'),
      values: {
        free: null,
        plus: 'Unlimited',
        business: 'Unlimited',
        enterprise: 'Custom',
      },
    },
    {
      key: 'users',
      label: t('Users'),
      values: {
        free: null,
        plus: null,
        business: '5+',
        enterprise: 'Custom',
      },
    },
    {
      key: 'projects',
      label: t('Projects'),
      values: {
        free: null,
        plus: null,
        business: '10',
        enterprise: 'Custom',
      },
    },
    {
      key: 'aiCredits',
      label: t('AI Credits'),
      values: {
        free: '200',
        plus: '500+',
        business: '1,000+',
        enterprise: 'Custom',
      },
    },
    {
      key: 'mcpServers',
      label: t('MCP Servers'),
      values: {
        free: '1',
        plus: 'Unlimited',
        business: null,
        enterprise: 'Custom',
      },
    },
    {
      key: 'tables',
      label: t('Tables'),
      values: {
        free: '1',
        plus: 'Unlimited',
        business: null,
        enterprise: 'Custom',
      },
    },
    {
      key: 'humanInLoop',
      label: t('Human in the Loop'),
      values: {
        free: null,
        plus: true,
        business: true,
        enterprise: true,
      },
    },
    {
      key: 'apiAccess',
      label: t('API Access'),
      values: {
        free: null,
        plus: null,
        business: true,
        enterprise: true,
      },
    },
    {
      key: 'sso',
      label: t('SSO'),
      values: {
        free: null,
        plus: null,
        business: true,
        enterprise: true,
      },
    },
  ],
};
