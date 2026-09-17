import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { sageAccountingAuth } from '../auth';
import { sageAccountingClient } from '../client';
import { newSalesInvoiceTriggerOutputSchema } from '../output-schemas';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof sageAccountingAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const items = await sageAccountingClient.listAll<SalesInvoicePollRecord>({
      accessToken: auth.access_token,
      path: sageAccountingClient.paths.salesInvoices,
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

export const newSalesInvoiceTrigger = createTrigger({
  auth: sageAccountingAuth,
  name: 'new_sales_invoice',
  classification: 'READ',
  displayName: 'New Sales Invoice',
  description: 'Triggers when a new sales invoice is created in Sage Accounting.',
  aiMetadata: {
    description: 'Fires once for each new sales invoice created in Sage Accounting.',
  },
  outputSchema: newSalesInvoiceTriggerOutputSchema,
  props: {},
  sampleData: {
    id: 'a1b2c3d4e5f6',
    invoice_number: 'SI-0034',
    contact_name: 'Starluck',
    date: '2026-01-15',
    due_date: '2026-02-14',
    total_amount: 100.4,
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

type SalesInvoicePollRecord = {
  id: string;
  invoice_number: string | null;
  contact_name: string | null;
  date: string;
  due_date: string | null;
  total_amount: number;
  created_at: string;
};
