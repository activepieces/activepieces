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

interface FreshserviceTicket {
  id: number;
  subject: string;
  description: string;
  status: number;
  priority: number;
  requester_id: number;
  responder_id: number | null;
  department_id: number | null;
  group_id: number | null;
  type: string;
  source: number;
  created_at: string;
  updated_at: string;
}

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof freshserviceAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS }) {
    const records =
      lastFetchEpochMS === 0
        ? await freshserviceListPages<FreshserviceTicket>({
            auth,
            endpoint: 'tickets',
            key: 'tickets',
            perPage: 10,
            maxPages: 1,
            allowTruncation: true,
            queryParams: { order_type: 'desc' },
          })
        : await freshserviceListPages<FreshserviceTicket>({
            auth,
            endpoint: 'tickets',
            key: 'tickets',
            queryParams: { updated_since: new Date(lastFetchEpochMS).toISOString(), order_type: 'asc' },
          });
    return records.map((record) => ({
      epochMilliSeconds: new Date(record.created_at).getTime(),
      data: record,
    }));
  },
};

export const newTicket = createTrigger({
  auth: freshserviceAuth,
  name: 'new_ticket',
  classification: 'READ',
  outputSchema: freshserviceSchemas.ticket,
  displayName: 'New Ticket',
  description: 'Triggers when a new ticket is created in Freshservice.',
  aiMetadata: {
    description: 'Fires when a new ticket is created in Freshservice, representing a freshly logged incident or service request. Polls every page of records since the last check, by creation time across all tickets in the account.',
  },
  props: {},
  sampleData: {
    id: 1,
    subject: 'Unable to access email',
    description: '<div>I cannot log into my email account since this morning.</div>',
    status: 2,
    priority: 2,
    requester_id: 1,
    responder_id: 5,
    department_id: 2,
    group_id: 1,
    type: 'Incident',
    source: 2,
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
