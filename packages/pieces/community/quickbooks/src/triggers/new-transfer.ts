import {
  TriggerStrategy,
  createTrigger,
  PiecePropValueSchema,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../index';
import dayjs from 'dayjs';
import {
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { quickbooksCommon, QuickbooksEntityResponse } from '../lib/common';
import { QuickbooksInvoice } from '../lib/types';

const polling: Polling<
 AppConnectionValueForAuthProperty<typeof quickbooksAuth>,
  Record<string, unknown>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS }) {
    const { access_token } = auth;
    const companyId = auth.props?.['companyId'] as string;

    const apiUrl = quickbooksCommon.getApiUrl(companyId!);

    const query =
      lastFetchEpochMS === 0
        ? `SELECT * FROM Transfer ORDERBY Metadata.CreateTime DESC MAXRESULTS 10`
        : `SELECT * FROM Transfer WHERE Metadata.CreateTime >= '${dayjs(
            lastFetchEpochMS
          ).toISOString()}' ORDERBY Metadata.CreateTime DESC`;

    const response = await httpClient.sendRequest<
      QuickbooksEntityResponse<QuickbooksInvoice>
    >({
      method: HttpMethod.GET,
      url: `${apiUrl}/query`,
      queryParams: { query: query, minorversion: '70' },
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/json',
      },
    });

    const transers = response.body.QueryResponse?.['Transfer'] ?? [];

    return transers.map((transfer) => ({
      epochMilliSeconds: dayjs(transfer.MetaData?.CreateTime).valueOf(),
      data: transfer,
    }));
  },
};

export const newTransfer = createTrigger({
  auth: quickbooksAuth,
  name: 'new_transfer',
  displayName: 'New Transfer',
  description:
    'Triggers when a Transfer is created.',
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
