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

    const records = await sageIntacctClient.queryAll<VendorPollRecord>({
      accessToken: auth.access_token,
      object: sageIntacctClient.objects.vendor,
      fields: ['key', 'id', 'name', 'status', 'billingType', 'audit.createdDateTime'],
      ...(filters.length > 0 ? { filters } : {}),
      orderBy: [{ 'audit.createdDateTime': 'asc' }],
    });

    return records.map((record) => ({
      epochMilliSeconds: new Date(record['audit.createdDateTime']).getTime(),
      data: record,
    }));
  },
};

export const newVendorTrigger = createTrigger({
  auth: sageIntacctAuth,
  name: 'new_vendor',
  classification: 'READ',
  displayName: 'New Vendor',
  description: 'Triggers when a new vendor is created in Sage Intacct.',
  aiMetadata: {
    description: 'Fires once for each new vendor created in Sage Intacct.',
  },
  props: {},
  sampleData: {
    key: '85',
    id: 'VEND-00002',
    name: 'Test vendor',
    status: 'active',
    billingType: 'openItem',
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

type VendorPollRecord = {
  key: string;
  id: string;
  name: string;
  status: string;
  billingType: string | null;
  'audit.createdDateTime': string;
};
