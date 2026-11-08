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
import {
  freshserviceListPages,
  REQUESTER_FILTER_MAX_PAGES,
  REQUESTER_FILTER_PAGE_SIZE,
} from '../common/client';
import { freshserviceSchemas } from '../common/schemas';

function utcDate(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 10);
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
            allowTruncation: true,
            queryParams: {},
          })
        : await freshserviceListPages<FreshserviceRequester>({
            auth,
            endpoint: 'requesters',
            key: 'requesters',
            perPage: REQUESTER_FILTER_PAGE_SIZE,
            maxPages: REQUESTER_FILTER_MAX_PAGES,
            queryParams: { query: `"updated_at:>'${utcDate(lastFetchEpochMS)}'"` },
          });
    return records.map((record) => ({
      epochMilliSeconds: new Date(record.updated_at).getTime(),
      data: record,
    }));
  },
};

export const updatedRequester = createTrigger({
  auth: freshserviceAuth,
  name: 'updated_requester',
  classification: 'READ',
  outputSchema: freshserviceSchemas.requester,
  displayName: 'Updated Requester',
  description: 'Triggers when an existing requester is updated in Freshservice.',
  aiMetadata: {
    description: 'Fires when an existing requester (end-user) record is modified in Freshservice (e.g. profile, contact, or department change), representing the latest state of that requester. Polls every page of records since the last check, by last-updated time across all requesters in the account.',
  },
  props: {},
  sampleData: {
    id: 1,
    first_name: 'Jane',
    last_name: 'Doe',
    primary_email: 'jane.doe@example.com',
    job_title: 'Senior Software Engineer',
    phone: '+1-555-0100',
    mobile_phone_number: '+1-555-0101',
    created_at: '2025-01-15T09:30:00Z',
    updated_at: '2025-01-16T14:20:00Z',
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
