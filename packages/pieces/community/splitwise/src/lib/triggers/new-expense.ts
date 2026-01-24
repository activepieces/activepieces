import {
  createTrigger,
  Property,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import { splitwiseAuth } from '../../index';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { splitwiseApi } from '../common/api';

const props = {
  group_id: Property.Dropdown<string, false, typeof splitwiseAuth>({
    displayName: 'Group',
    description: 'Filter expenses from a specific group (optional)',
    required: false,
    auth: splitwiseAuth,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your account first',
          options: [],
        };
      }
      try {
        const groups = await splitwiseApi.getGroups(auth.secret_text);
        return {
          options: [
            { label: 'All Groups', value: '' },
            ...groups.map((group: any) => ({
              label: group.name,
              value: String(group.id),
            })),
          ],
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Failed to load groups',
          options: [],
        };
      }
    },
  }),
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof splitwiseAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS, propsValue }) {
    const isTest = lastFetchEpochMS === 0;
    const updatedAfter = isTest ? undefined : new Date(lastFetchEpochMS).toISOString();
    const groupIdNum = propsValue.group_id ? parseInt(propsValue.group_id) : undefined;

    const expenses = await splitwiseApi.getExpenses(auth.secret_text, groupIdNum, updatedAfter);

    return expenses.map((expense: any) => ({
      epochMilliSeconds: new Date(expense.created_at).getTime(),
      data: expense,
    }));
  },
};

export const newExpenseTrigger = createTrigger({
  auth: splitwiseAuth,
  name: 'new_expense',
  displayName: 'New Expense',
  description: 'Triggers when a new expense is created. Optionally, filter for a specific group.',
  props,
  type: TriggerStrategy.POLLING,
  sampleData: {},
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
