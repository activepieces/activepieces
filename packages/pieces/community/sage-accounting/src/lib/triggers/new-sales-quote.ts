import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { sageAccountingAuth } from '../auth';
import { sageAccountingClient } from '../client';
import { newSalesQuoteTriggerOutputSchema } from '../output-schemas';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof sageAccountingAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const items = await sageAccountingClient.listAll<SalesQuotePollRecord>({
      accessToken: auth.access_token,
      path: sageAccountingClient.paths.salesQuotes,
      query: {
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

export const newSalesQuoteTrigger = createTrigger({
  auth: sageAccountingAuth,
  name: 'new_sales_quote',
  classification: 'READ',
  displayName: 'New Sales Quote',
  description: 'Triggers when a new sales quote is created in Sage Accounting.',
  aiMetadata: {
    description: 'Fires once for each new sales quote created in Sage Accounting.',
  },
  outputSchema: newSalesQuoteTriggerOutputSchema,
  props: {},
  sampleData: {
    id: 'q1q2q3q4',
    quote_number: 'QU-0012',
    contact_name: 'Starluck',
    date: '2026-01-15',
    expiry_date: '2026-02-14',
    total_amount: 250,
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

type SalesQuotePollRecord = {
  id: string;
  quote_number: string | null;
  contact_name: string | null;
  date: string;
  expiry_date: string;
  total_amount: number;
  created_at: string;
};
