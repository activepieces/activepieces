import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { sageAccountingAuth } from '../auth';
import { sageAccountingClient } from '../client';
import { newCustomerTriggerOutputSchema } from '../output-schemas';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof sageAccountingAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const items = await sageAccountingClient.listAll<CustomerPollRecord>({
      accessToken: auth.access_token,
      path: sageAccountingClient.paths.contacts,
      query: {
        contact_type_id: sageAccountingClient.contactTypes.customer,
        ...(lastFetchEpochMS > 0
          ? { updated_or_created_since: new Date(lastFetchEpochMS).toISOString() }
          : {}),
      },
    });

    return items.map((record) => ({
      epochMilliSeconds: new Date(record.created_at).getTime(),
      data: record,
    }));
  },
};

export const newCustomerTrigger = createTrigger({
  auth: sageAccountingAuth,
  name: 'new_customer',
  classification: 'READ',
  displayName: 'New Customer',
  description: 'Triggers when a new customer is created in Sage Accounting.',
  aiMetadata: {
    description: 'Fires once for each new customer created in Sage Accounting.',
  },
  outputSchema: newCustomerTriggerOutputSchema,
  props: {},
  sampleData: {
    id: '521229b29af04f3682d85b0d43ef5361',
    name: 'ABS Garages Ltd',
    reference: 'ABS001',
    email: 'accounts@absgarages.example',
    credit_limit: 5000,
    is_active: true,
    created_at: '2026-01-15T10:30:00Z',
  },
  type: TriggerStrategy.POLLING,
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

type CustomerPollRecord = {
  id: string;
  name: string;
  reference: string | null;
  email: string | null;
  credit_limit: number | null;
  is_active: boolean;
  created_at: string;
};
