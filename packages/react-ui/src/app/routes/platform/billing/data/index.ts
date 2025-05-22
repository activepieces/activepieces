import { t } from 'i18next';

export const planData = {
  tabs: [t('Monthly'), t('Annual')],

  plans: [
    {
      id: 'free',
      name: t('Free'),
      description: t('Explorers & Tinkers'),
      monthlyPrice: '$0',
      yearlyPrice: '$0',
    },
    {
      id: 'plus',
      name: t('Plus'),
      description: t('Standard Users'),
      monthlyPrice: '$25/mo',
      yearlyPrice: '$19/mo',
      yearlyDiscount: '24% off',
    },
    {
      id: 'business',
      name: t('Business'),
      description: t('Power Users & Small Teams'),
      monthlyPrice: '$150/mo',
      yearlyPrice: '$114/mo',
      yearlyDiscount: '24% off',
    },
    {
      id: 'enterprise',
      name: t('Enterprise'),
      description: t('Cloud or Self-Hosted'),
      isCustom: true,
      salesPrice: t('Talk to Sales'),
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
        free: '5',
        plus: '10+',
        business: '50+',
        enterprise: 'Custom',
      },
    },
    {
      key: 'tables',
      label: t('Tables'),
      values: {
        free: '1',
        plus: '5',
        business: '20',
        enterprise: 'Custom',
      },
    },
    {
      key: 'projects',
      label: t('Projects'),
      values: {
        free: '1',
        plus: '1',
        business: '15',
        enterprise: 'Custom',
      },
    },
    {
      key: 'mcpServers',
      label: t('MCP Servers'),
      values: {
        free: '1',
        plus: '10',
        business: '25',
        enterprise: 'Custom',
      },
    },
    {
      key: 'aiAgents',
      label: t('AI Agents'),
      values: { free: false, plus: true, business: true, enterprise: true },
    },
    {
      key: 'aiCredits',
      label: t('AI Credits'),
      values: {
        free: '200',
        plus: '500+ Icons (Spend Limit)',
        business: '1,000+ Icons (Spend Limit, BYOK)',
        enterprise: 'Custom',
      },
    },
    {
      key: 'humanInLoop',
      label: t('Human in the Loop'),
      values: { free: false, plus: true, business: true, enterprise: true },
    },
    {
      key: 'users',
      label: t('Users'),
      values: {
        free: '1',
        plus: '1',
        business: '20+',
        enterprise: 'Custom',
      },
    },
  ],
};
