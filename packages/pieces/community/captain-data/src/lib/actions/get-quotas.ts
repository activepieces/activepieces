import { createAction } from '@activepieces/pieces-framework';
import { captainDataAuth } from '../auth';
import { captainDataClient } from '../common';

export const getQuotas = createAction({
  name: 'get_quotas',
  classification: 'READ',
  displayName: 'Get Credit Quota',
  description:
    'Gets your workspace plan and how many Captain Data credits are left this month. Free (0 credits).',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the Captain Data workspace plan and credit usage: credits_left, credits_max, credits_used and the current billing month. Costs 0 credits. Call it before credit-heavy searches to check the budget.',
    idempotent: true,
  },
  auth: captainDataAuth,
  props: {},
  outputSchema: {
    fields: [
      { key: 'uid', label: 'Workspace UID' },
      { key: 'name', label: 'Workspace Name' },
      { key: 'plan_name', label: 'Plan' },
      { key: 'credits_left', label: 'Credits Left', format: 'number' },
      { key: 'credits_max', label: 'Credits Max', format: 'number' },
      { key: 'credits_used', label: 'Credits Used', format: 'number' },
      {
        key: 'current_month_start',
        label: 'Current Month Start',
        format: 'datetime',
      },
      {
        key: 'current_month_end',
        label: 'Current Month End',
        format: 'datetime',
      },
    ],
  },
  async run({ auth }) {
    return captainDataClient.getObject({
      apiKey: auth.props.apiKey,
      path: '/quotas',
      operation: 'get quotas',
    });
  },
});
