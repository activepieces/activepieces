import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { sageAccountingAuth } from '../auth';
import { sageAccountingClient } from '../client';
import { newPurchaseInvoiceTriggerOutputSchema } from '../output-schemas';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof sageAccountingAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const items = await sageAccountingClient.listAll<PurchaseInvoicePollRecord>({
      accessToken: auth.access_token,
      path: sageAccountingClient.paths.purchaseInvoices,
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

export const newPurchaseInvoiceTrigger = createTrigger({
  auth: sageAccountingAuth,
  name: 'new_purchase_invoice',
  classification: 'READ',
  displayName: 'New Purchase Invoice',
  description: 'Triggers when a new purchase invoice is created in Sage Accounting.',
  aiMetadata: {
    description: 'Fires once for each new purchase invoice created in Sage Accounting.',
  },
  outputSchema: newPurchaseInvoiceTriggerOutputSchema,
  props: {},
  sampleData: {
    id: 'f6e5d4c3b2a1',
    vendor_reference: 'PO-4001',
    contact_name: 'Acme Supplies',
    date: '2026-01-15',
    due_date: '2026-03-16',
    total_amount: 101,
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

type PurchaseInvoicePollRecord = {
  id: string;
  vendor_reference: string | null;
  contact_name: string | null;
  date: string;
  due_date: string;
  total_amount: number;
  created_at: string;
};
