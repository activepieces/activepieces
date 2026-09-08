import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { sageIntacctAuth } from '../auth';
import { IntacctFilter, sageIntacctClient } from '../client';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof sageIntacctAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const filters: IntacctFilter[] = [{ $eq: { documentType: 'Sales Invoice' } }];
    if (lastFetchEpochMS > 0) {
      filters.push({ $gt: { 'audit.createdDateTime': new Date(lastFetchEpochMS).toISOString() } });
    }

    const records = await sageIntacctClient.queryAll<SalesInvoicePollRecord>({
      accessToken: auth.access_token,
      object: sageIntacctClient.objects.orderEntryDocument,
      fields: [
        'key',
        'id',
        'documentNumber',
        'txnDate',
        'dueDate',
        'total',
        'state',
        'audit.createdDateTime',
      ],
      filters,
      orderBy: [{ 'audit.createdDateTime': 'asc' }],
    });

    return records.map((record) => ({
      epochMilliSeconds: new Date(record['audit.createdDateTime']).getTime(),
      data: record,
    }));
  },
};

export const newSalesInvoiceTrigger = createTrigger({
  auth: sageIntacctAuth,
  name: 'new_sales_invoice',
  classification: 'READ',
  displayName: 'New Sales Invoice (Order Entry)',
  description: 'Triggers when a new Order Entry sales invoice is created in Sage Intacct.',
  aiMetadata: {
    description:
      'Fires once for each new Order Entry document using the Sales Invoice transaction definition. Distinct from New Invoice (AR), which is the accounts-receivable module invoice object.',
  },
  props: {},
  sampleData: {
    key: '512',
    id: 'SO-2001',
    documentNumber: 'SO-2001',
    txnDate: '2026-01-15',
    dueDate: '2026-02-14',
    total: 650,
    state: 'submitted',
    'audit.createdDateTime': '2026-01-15T10:30:00Z',
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
  key: string;
  id: string;
  documentNumber: string | null;
  txnDate: string;
  dueDate: string | null;
  total: number | null;
  state: string;
  'audit.createdDateTime': string;
};
