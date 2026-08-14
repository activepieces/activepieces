import {
  TriggerStrategy,
  createTrigger,
  PiecePropValueSchema,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../lib/auth';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { quickbooksQuery, QuickbooksEntityResponse } from '../lib/common';
import { QuickbooksPurchase } from '../lib/types';
import dayjs from 'dayjs';

const polling: Polling<
 AppConnectionValueForAuthProperty<typeof quickbooksAuth>,
  Record<string, unknown>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS }) {
    const { access_token } = auth;
    const companyId = auth.props?.['companyId'] as string;

    const query =
      lastFetchEpochMS === 0
        ? `SELECT * FROM Purchase ORDERBY Metadata.CreateTime DESC MAXRESULTS 10`
        : `SELECT * FROM Purchase WHERE Metadata.CreateTime >= '${dayjs(
            lastFetchEpochMS
          ).toISOString()}' ORDERBY Metadata.CreateTime DESC`;

    // https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/purchase#query-a-purchase
    const response = await quickbooksQuery<
      QuickbooksEntityResponse<QuickbooksPurchase>
    >({
      accessToken: access_token,
      companyId,
      query,
    });

    const purchases = response.QueryResponse?.['Purchase'] ?? [];

    return purchases.map((purchase) => ({
      epochMilliSeconds: dayjs(purchase.MetaData?.CreateTime).valueOf(),
      data: purchase,
    }));
  },
};

export const newExpense = createTrigger({
  auth: quickbooksAuth,
  name: 'new_expense',
  displayName: 'New Expense (Purchase)',
  description: 'Triggers when an Expense (Purchase) is created.',
  aiMetadata: {
    description: 'Fires when a new expense (purchase transaction) is created in the connected QuickBooks company, emitting the newly created purchase record. Use to react to money being spent or a bill being recorded.',
  },
  props: {},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  sampleData: undefined,
});
