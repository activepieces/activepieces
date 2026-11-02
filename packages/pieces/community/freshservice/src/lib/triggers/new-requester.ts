import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../';
import { freshserviceListPages } from '../common/client';
import { freshserviceSchemas } from '../common/schemas';

interface FreshserviceRequester {
  id: number;
  first_name: string;
  last_name: string;
  primary_email: string;
  job_title: string | null;
  phone: string | null;
  mobile_phone_number: string | null;
  created_at: string;
  updated_at: string;
}

function dayBefore(epochMs: number): string {
  return new Date(epochMs - 86400000).toISOString().slice(0, 10);
}

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof freshserviceAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS }) {
    const records =
      lastFetchEpochMS === 0
        ? await freshserviceListPages<FreshserviceRequester>({
            auth,
            endpoint: 'requesters',
            key: 'requesters',
            perPage: 10,
            maxPages: 1,
            queryParams: {},
          })
        : await freshserviceListPages<FreshserviceRequester>({
            auth,
            endpoint: 'requesters',
            key: 'requesters',
            queryParams: { query: `"created_at:>'${dayBefore(lastFetchEpochMS)}'"` },
          });
    return records.map((record) => ({
      epochMilliSeconds: new Date(record.created_at).getTime(),
      data: record,
    }));
  },
};

export const newRequester = createTrigger({
  auth: freshserviceAuth,
  name: 'new_requester',
  classification: 'READ',
  outputSchema: freshserviceSchemas.requester,
  displayName: 'New Requester',
  description: 'Triggers when a new requester (user) is created in Freshservice.',
  aiMetadata: {
    description: 'Fires when a new requester (end-user) record is created in Freshservice, representing a person newly onboarded into the help desk. Polls every page of records since the last check, by creation time across all requesters in the account.',
  },
  props: {},
  sampleData: {
    id: 1,
    first_name: 'Jane',
    last_name: 'Doe',
    primary_email: 'jane.doe@example.com',
    job_title: 'Software Engineer',
    phone: '+1-555-0100',
    mobile_phone_number: '+1-555-0101',
    created_at: '2025-01-15T09:30:00Z',
    updated_at: '2025-01-15T09:30:00Z',
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
