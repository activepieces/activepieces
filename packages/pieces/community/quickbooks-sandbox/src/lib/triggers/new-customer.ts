import {
  TriggerStrategy,
  createTrigger,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../auth';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { quickbooksApi } from '../common/api';
import dayjs from 'dayjs';
import type { QuickbooksEntityResponse, QuickbooksCustomer } from '../common/types';
import { newCustomerOutputSchema } from '../output-schemas';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof quickbooksAuth>,
  Record<string, unknown>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS }) {
    const query =
      lastFetchEpochMS === 0
        ? `SELECT * FROM Customer ORDERBY Metadata.CreateTime DESC MAXRESULTS 10`
        : `SELECT * FROM Customer WHERE Metadata.CreateTime >= '${dayjs(
            lastFetchEpochMS
          ).toISOString()}' ORDERBY Metadata.CreateTime DESC`;

    const response = await quickbooksApi.query<
      QuickbooksEntityResponse<QuickbooksCustomer>
    >({
      auth,
      query,
    });

    const customers = response.QueryResponse?.['Customer'] ?? [];

    return customers.map((customer) => ({
      epochMilliSeconds: dayjs(customer.MetaData?.CreateTime).valueOf(),
      data: customer,
    }));
  },
};

export const newCustomer = createTrigger({
  auth: quickbooksAuth,
  name: 'new_customer',
  outputSchema: newCustomerOutputSchema,
  displayName: 'New Customer',
  description: 'Triggers when a new customer is created.',
  aiMetadata: {
    description: 'Fires when a new customer is created in the connected QuickBooks company, emitting the newly created customer record. Use to react to a new customer being added to the books.',
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
