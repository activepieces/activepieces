import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  HttpMethod,
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../';
import { freshserviceApiCall } from '../common/client';

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
    const response = await freshserviceApiCall<{
      tickets: FreshserviceTicket[];
    }>({
      method: HttpMethod.GET,
      endpoint: 'tickets',
      auth,
      queryParams: {
        order_by: 'updated_at',
        order_type: 'desc',
        per_page: lastFetchEpochMS === 0 ? '10' : '100',
      },
    });

    return response.body.tickets.map((ticket) => ({
      epochMilliSeconds: new Date(ticket.updated_at).getTime(),
      data: ticket,
    }));
  },
};

export const updatedTicket = createTrigger({
  auth: freshserviceAuth,
  name: 'updated_ticket',
  displayName: 'Updated Ticket',
  description: 'Triggers when an existing ticket is updated in Freshservice.',
  props: {},
  sampleData: {
    id: 1,
    subject: 'Unable to access email',
    description: '<div>I cannot log into my email account since this morning.</div>',
    status: 3,
    priority: 3,
    requester_id: 1,
    responder_id: 5,
    department_id: 2,
    group_id: 1,
    type: 'Incident',
    source: 2,
    created_at: '2025-01-15T09:30:00Z',
    updated_at: '2025-01-15T11:45:00Z',
  },
  type: TriggerStrategy.POLLING,

  async test(context) {
    return await pollingHelper.test(polling, context);
  },

  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },

  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
