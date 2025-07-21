import {
  TriggerStrategy,
  createTrigger,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../index';
import {
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { quickbooksCommon, QuickbooksEntityResponse } from '../lib/common';
import { QuickbooksPurchase } from '../lib/types';
import dayjs from 'dayjs';

const polling: Polling<
  PiecePropValueSchema<typeof quickbooksAuth>,
  Record<string, unknown>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS }) {
    const { access_token } = auth;
    const companyId = auth.props?.['companyId'];

    const apiUrl = quickbooksCommon.getApiUrl(companyId);

    const query =
      lastFetchEpochMS === 0
        ? `SELECT * FROM Purchase ORDERBY Metadata.CreateTime DESC MAXRESULTS 10`
        : `SELECT * FROM Purchase WHERE Metadata.CreateTime >= '${dayjs(
            lastFetchEpochMS
          ).toISOString()}' ORDERBY Metadata.CreateTime DESC`;

    const response = await httpClient.sendRequest<
      QuickbooksEntityResponse<QuickbooksPurchase>
    >({
      method: HttpMethod.GET,
      url: `${apiUrl}/query`,
      queryParams: { query: query, minorversion: '70' },
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/json',
      },
    });

    const purchases = response.body.QueryResponse?.['Purchase'] ?? [];

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
  props: {},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  sampleData: undefined,
});
