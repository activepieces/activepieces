import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { sageIntacctAuth } from '../auth';
import { IntacctFilter, sageIntacctClient } from '../client';

type PaymentPollRecord = {
  key: string;
  id: string;
  documentNumber: string | null;
  payerName: string | null;
  paidDate: string | null;
  paymentMethod: string | null;
  referenceNumber: string | null;
  state: string;
  'audit.createdDateTime': string;
};

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

    const { records } = await sageIntacctClient.query<PaymentPollRecord>({
      accessToken: auth.access_token,
      object: sageIntacctClient.objects.arPayment,
      fields: [
        'key',
        'id',
        'documentNumber',
        'payerName',
        'paidDate',
        'paymentMethod',
        'referenceNumber',
        'state',
        'audit.createdDateTime',
      ],
      ...(filters.length > 0 ? { filters } : {}),
      orderBy: [{ 'audit.createdDateTime': 'asc' }],
      size: 100,
    });

    return records.map((record) => ({
      epochMilliSeconds: new Date(record['audit.createdDateTime']).getTime(),
      data: record,
    }));
  },
};

export const newPaymentReceivedTrigger = createTrigger({
  auth: sageIntacctAuth,
  name: 'new_payment_received',
  classification: 'READ',
  displayName: 'New Payment Received (AR)',
  description: 'Triggers when a new accounts-receivable payment is recorded in Sage Intacct.',
  aiMetadata: {
    description: 'Fires once for each new AR payment recorded in Sage Intacct.',
  },
  props: {},
  sampleData: {
    key: '210',
    id: '210',
    documentNumber: 'PMT-0088',
    payerName: 'Starluck',
    paidDate: '2026-01-15',
    paymentMethod: 'creditcard',
    referenceNumber: 'REF-556',
    state: 'confirmed',
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
