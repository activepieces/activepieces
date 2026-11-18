import {
  TriggerStrategy,
  createTrigger,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../auth';
import dayjs from 'dayjs';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { quickbooksApi } from '../common/api';
import type { QuickbooksEntityResponse, QuickbooksInvoice } from '../common/types';
import { newTransferOutputSchema } from '../output-schemas';

const polling: Polling<
 AppConnectionValueForAuthProperty<typeof quickbooksAuth>,
  Record<string, unknown>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS }) {
    const query =
      lastFetchEpochMS === 0
        ? `SELECT * FROM Transfer ORDERBY Metadata.CreateTime DESC MAXRESULTS 10`
        : `SELECT * FROM Transfer WHERE Metadata.CreateTime >= '${dayjs(
            lastFetchEpochMS
          ).toISOString()}' ORDERBY Metadata.CreateTime DESC`;

    const response = await quickbooksApi.query<
      QuickbooksEntityResponse<QuickbooksInvoice>
    >({
      auth,
      query,
    });

    const transers = response.QueryResponse?.['Transfer'] ?? [];

    return transers.map((transfer) => ({
      epochMilliSeconds: dayjs(transfer.MetaData?.CreateTime).valueOf(),
      data: transfer,
    }));
  },
};

export const newTransfer = createTrigger({
  auth: quickbooksAuth,
  name: 'new_transfer',
  outputSchema: newTransferOutputSchema,
  displayName: 'New Transfer',
  description:
    'Triggers when a Transfer is created.',
  aiMetadata: {
    description: 'Fires when a new transfer is created in the connected QuickBooks company, emitting the newly created transfer record. Use to react to funds being moved between two accounts.',
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
