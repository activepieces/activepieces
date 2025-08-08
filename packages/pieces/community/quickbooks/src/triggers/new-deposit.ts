import {
    PiecePropValueSchema,
    TriggerStrategy,
    createTrigger,
} from "@activepieces/pieces-framework";
import { quickbooksAuth } from '../index';
import { DedupeStrategy, httpClient, HttpMethod, Polling, pollingHelper } from "@activepieces/pieces-common";
import { quickbooksCommon, QuickbooksEntityResponse } from "../lib/common";
import { QuickbooksCustomer } from '../lib/types';
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
        ? `SELECT * FROM Deposit ORDERBY Metadata.CreateTime DESC MAXRESULTS 10`
        : `SELECT * FROM Deposit WHERE Metadata.CreateTime >= '${dayjs(
            lastFetchEpochMS
          ).toISOString()}' ORDERBY Metadata.CreateTime DESC`;

    const response = await httpClient.sendRequest<
      QuickbooksEntityResponse<QuickbooksCustomer>
    >({
      method: HttpMethod.GET,
      url: `${apiUrl}/query`,
      queryParams: { query: query, minorversion: '70' },
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/json',
      },
    });

    const deposits = response.body.QueryResponse?.['Deposit'] ?? [];

    return deposits.map((deposit) => ({
      epochMilliSeconds: dayjs(deposit.MetaData?.CreateTime).valueOf(),
      data: deposit,
    }));
  },
};

export const newDeposit = createTrigger({
    auth: quickbooksAuth,
    name: 'new_deposit',
    displayName: 'New Deposit',
    description: 'Triggers when a Deposit is created.',
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