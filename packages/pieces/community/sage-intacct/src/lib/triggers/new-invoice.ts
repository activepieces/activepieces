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
    const filters: IntacctFilter[] =
      lastFetchEpochMS > 0
        ? [{ $gt: { 'audit.createdDateTime': new Date(lastFetchEpochMS).toISOString() } }]
        : [];

    const records = await sageIntacctClient.queryAll<InvoicePollRecord>({
      accessToken: auth.access_token,
      object: sageIntacctClient.objects.arInvoice,
      fields: [
        'key',
        'id',
        'invoiceNumber',
        'state',
        'invoiceDate',
        'dueDate',
        'totalTxnAmount',
        'audit.createdDateTime',
      ],
      ...(filters.length > 0 ? { filters } : {}),
      orderBy: [{ 'audit.createdDateTime': 'asc' }],
    });

    return records.map((record) => ({
      epochMilliSeconds: new Date(record['audit.createdDateTime']).getTime(),
      data: record,
    }));
  },
};

export const newInvoiceTrigger = createTrigger({
  auth: sageIntacctAuth,
  name: 'new_invoice',
  classification: 'READ',
  displayName: 'New Invoice (AR)',
  description: 'Triggers when a new accounts-receivable invoice is created in Sage Intacct.',
  aiMetadata: {
    description: 'Fires once for each new AR invoice created in Sage Intacct.',
  },
  props: {},
  sampleData: {
    key: '34',
    id: 'SI-0034',
    invoiceNumber: 'SI-0034',
    state: 'posted',
    invoiceDate: '2026-01-15',
    dueDate: '2026-02-14',
    totalTxnAmount: 100.4,
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

type InvoicePollRecord = {
  key: string;
  id: string;
  invoiceNumber: string | null;
  state: string;
  invoiceDate: string;
  dueDate: string;
  totalTxnAmount: number | null;
  'audit.createdDateTime': string;
};
