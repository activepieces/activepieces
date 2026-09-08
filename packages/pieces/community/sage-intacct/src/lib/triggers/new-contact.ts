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

    const records = await sageIntacctClient.queryAll<ContactPollRecord>({
      accessToken: auth.access_token,
      object: sageIntacctClient.objects.contact,
      fields: ['key', 'id', 'printAs', 'email1', 'phone1', 'status', 'audit.createdDateTime'],
      ...(filters.length > 0 ? { filters } : {}),
      orderBy: [{ 'audit.createdDateTime': 'asc' }],
    });

    return records.map((record) => ({
      epochMilliSeconds: new Date(record['audit.createdDateTime']).getTime(),
      data: record,
    }));
  },
};

export const newContactTrigger = createTrigger({
  auth: sageIntacctAuth,
  name: 'new_contact',
  classification: 'READ',
  displayName: 'New Contact',
  description: 'Triggers when a new contact is created in Sage Intacct.',
  aiMetadata: {
    description: 'Fires once for each new contact created in Sage Intacct.',
  },
  props: {},
  sampleData: {
    key: '12',
    id: 'AMoore',
    printAs: 'Andy Moore',
    email1: 'andy.moore@example.com',
    phone1: '9134598676',
    status: 'active',
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

type ContactPollRecord = {
  key: string;
  id: string;
  printAs: string;
  email1: string | null;
  phone1: string | null;
  status: string;
  'audit.createdDateTime': string;
};
