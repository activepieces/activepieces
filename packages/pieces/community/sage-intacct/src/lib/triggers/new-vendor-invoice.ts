import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { sageIntacctAuth } from '../auth';
import { IntacctFilter, sageIntacctClient } from '../client';

type VendorInvoicePollRecord = {
  key: string;
  id: string;
  documentNumber: string | null;
  txnDate: string;
  dueDate: string | null;
  total: number | null;
  state: string;
  'audit.createdDateTime': string;
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof sageIntacctAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const filters: IntacctFilter[] = [{ $eq: { documentType: 'Vendor Invoice' } }];
    if (lastFetchEpochMS > 0) {
      filters.push({ $gt: { 'audit.createdDateTime': new Date(lastFetchEpochMS).toISOString() } });
    }

    const { records } = await sageIntacctClient.query<VendorInvoicePollRecord>({
      accessToken: auth.access_token,
      object: sageIntacctClient.objects.purchasingDocument,
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
      size: 100,
    });

    return records.map((record) => ({
      epochMilliSeconds: new Date(record['audit.createdDateTime']).getTime(),
      data: record,
    }));
  },
};

export const newVendorInvoiceTrigger = createTrigger({
  auth: sageIntacctAuth,
  name: 'new_vendor_invoice',
  classification: 'READ',
  displayName: 'New Vendor Invoice (Purchasing)',
  description: 'Triggers when a new Purchasing vendor invoice is created in Sage Intacct.',
  aiMetadata: {
    description:
      'Fires once for each new Purchasing document using the Vendor Invoice transaction definition.',
  },
  props: {},
  sampleData: {
    key: '733',
    id: 'PO-4001',
    documentNumber: 'PO-4001',
    txnDate: '2026-01-15',
    dueDate: '2026-03-16',
    total: 101,
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
