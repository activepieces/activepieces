import {
  AppConnectionValueForAuthProperty,
    PiecePropValueSchema,
    TriggerStrategy,
    createTrigger,
} from "@activepieces/pieces-framework";
import { quickbooksAuth } from '../lib/auth';
import { DedupeStrategy, Polling, pollingHelper } from "@activepieces/pieces-common";
import { quickbooksQuery, QuickbooksEntityResponse } from "../lib/common";
import { QuickbooksCustomer } from '../lib/types';
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
        ? `SELECT * FROM Deposit ORDERBY Metadata.CreateTime DESC MAXRESULTS 10`
        : `SELECT * FROM Deposit WHERE Metadata.CreateTime >= '${dayjs(
            lastFetchEpochMS
          ).toISOString()}' ORDERBY Metadata.CreateTime DESC`;

    // https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/deposit#query-a-deposit
    const response = await quickbooksQuery<
      QuickbooksEntityResponse<QuickbooksCustomer>
    >({
      accessToken: access_token,
      companyId,
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