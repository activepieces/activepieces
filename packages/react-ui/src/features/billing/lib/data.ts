import { t } from 'i18next';

import { PlanName } from '@activepieces/ee-shared';

import PlanFreeImg from '@/assets/img/custom/plans/1.png';
import PlanPlusImg from '@/assets/img/custom/plans/2.png';
import PlanBusinessImg from '@/assets/img/custom/plans/3.png';
import PlanEnterpriseImg from '@/assets/img/custom/plans/4.png';

export const planData = {
  tabs: [t('Monthly'), t('Annual')],

  plans: [
    {
      name: PlanName.FREE,
      description: t('Explorers & Tinkers'),
      price: 0,
      image: PlanFreeImg,
    },
    {
      name: PlanName.PLUS,
      description: t('Standard Users'),
      price: 25,
      image: PlanPlusImg,
    },
    {
      name: PlanName.BUSINESS,
      description: t('Power Users & Small Teams'),
      price: 150,
      image: PlanBusinessImg,
    },
    {
      name: PlanName.ENTERPRISE,
      description: t('Cloud or Self-Hosted'),
      price: 'Custom',
      image: PlanEnterpriseImg,
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
      key: 'users',
      label: t('Users'),
      values: {
        free: '1',
        plus: '1',
        business: '5+',
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
      key: 'tables',
      label: t('Tables'),
      values: {
        free: '1',
        plus: 'Unlimited',
        business: 'Unlimited',
        enterprise: 'Custom',
      },
    },
    {
      key: 'projects',
      label: t('Projects'),
      values: {
        free: '1',
        plus: '1',
        business: '10',
        enterprise: 'Custom',
      },
    },
    {
      key: 'mcpServers',
      label: t('MCP Servers'),
      values: {
        free: '1',
        plus: 'Unlimited',
        business: 'Unlimited',
        enterprise: 'Custom',
      },
    },
    {
      key: 'aiAgents',
      label: t('AI Agents'),
      values: { free: false, plus: '5', business: '20', enterprise: 'Custom' },
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
      key: 'humanInLoop',
      label: t('Human in the Loop'),
      values: { free: false, plus: true, business: true, enterprise: true },
    },

  ],
};
