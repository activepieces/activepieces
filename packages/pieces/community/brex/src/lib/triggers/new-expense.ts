import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { brexAuth } from '../../';
import { brexCommon, BrexExpense } from '../common';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof brexAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const response = await brexCommon.apiCall<{ items: BrexExpense[] }>({
      token: brexCommon.getToken(auth),
      method: HttpMethod.GET,
      path: '/v1/expenses?expand[]=merchant',
      queryParams: { limit: '100' },
    });
    return response.body.items.map((expense) => ({
      epochMilliSeconds: new Date(
        expense.updated_at ?? expense.purchased_at ?? 0
      ).getTime(),
      data: brexCommon.flattenExpense(expense),
    }));
  },
};

export const newExpense = createTrigger({
  auth: brexAuth,
  name: 'new_expense',
  displayName: 'New Expense',
  description: 'Triggers when a new expense is created or updated.',
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 'expense_id',
    memo: 'Team lunch',
    status: 'APPROVED',
    expense_type: 'CARD',
    payment_status: 'CLEARED',
    category: 'RESTAURANTS',
    user_id: 'user_id',
    merchant_id: 'merchant_id',
    merchant_name: 'SQ *COFFEE SHOP',
    department_id: null,
    location_id: null,
    budget_id: null,
    purchased_at: '2024-01-01T12:00:00Z',
    updated_at: '2024-01-01T12:05:00Z',
    original_amount: 24.5,
    original_amount_currency: 'USD',
    billing_amount: 24.5,
    billing_amount_currency: 'USD',
    usd_equivalent_amount: 24.5,
    dashboard_url: 'https://dashboard.brex.com/expenses/expense_id',
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
