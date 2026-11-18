import {
  AppConnectionValueForAuthProperty,
    TriggerStrategy,
    createTrigger,
} from "@activepieces/pieces-framework";
import { quickbooksAuth } from '../auth';
import { DedupeStrategy, Polling, pollingHelper } from "@activepieces/pieces-common";
import { quickbooksApi } from '../common/api';
import type { QuickbooksEntityResponse, QuickbooksCustomer } from '../common/types';
import dayjs from 'dayjs';
import { newDepositOutputSchema } from '../output-schemas';

const polling: Polling<
 AppConnectionValueForAuthProperty<typeof quickbooksAuth>,
  Record<string, unknown>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS }) {
    const query =
      lastFetchEpochMS === 0
        ? `SELECT * FROM Deposit ORDERBY Metadata.CreateTime DESC MAXRESULTS 10`
        : `SELECT * FROM Deposit WHERE Metadata.CreateTime >= '${dayjs(
            lastFetchEpochMS
          ).toISOString()}' ORDERBY Metadata.CreateTime DESC`;

    const response = await quickbooksApi.query<
      QuickbooksEntityResponse<QuickbooksCustomer>
    >({
      auth,
      query,
    });

    const deposits = response.QueryResponse?.['Deposit'] ?? [];

    return deposits.map((deposit) => ({
      epochMilliSeconds: dayjs(deposit.MetaData?.CreateTime).valueOf(),
      data: deposit,
    }));
  },
};

export const newDeposit = createTrigger({
    auth: quickbooksAuth,
    name: 'new_deposit',
    outputSchema: newDepositOutputSchema,
    displayName: 'New Deposit',
    description: 'Triggers when a Deposit is created.',
    aiMetadata: {
      description: 'Fires when a new deposit is created in the connected QuickBooks company, emitting the newly created deposit record. Use to react to funds being deposited into an account.',
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