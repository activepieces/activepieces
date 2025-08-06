import {
  TriggerStrategy,
  createTrigger,
  Property,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../..';

export const newActionOnTicket = createTrigger({
  auth: zendeskAuth,
  name: 'new_action_on_ticket',
  displayName: 'New Action on Ticket',
  description: 'Triggers when any audit/event occurs on a specific ticket (admin limited)',
  type: TriggerStrategy.POLLING,
  props: {
    ticket_id: Property.ShortText({
      displayName: 'Ticket ID',
      description: 'The ID of the ticket to monitor for actions',
      required: true,
    }),
  },
  sampleData: {
    id: 123456789,
    ticket_id: 5,
    created_at: '2023-03-25T02:39:41Z',
    author_id: 8193592318236,
    via: {
      channel: 'web',
      source: {
        from: {},
        to: {},
        rel: null,
      },
    },
    events: [
      {
        id: 123456789,
        type: 'Comment',
        public: true,
        body: 'This is a comment on the ticket',
        html_body: '<p>This is a comment on the ticket</p>',
        plain_body: 'This is a comment on the ticket',
        audit_id: 123456789,
        created_at: '2023-03-25T02:39:41Z',
        author_id: 8193592318236,
        metadata: {
          client: 'web',
          location: 'unknown',
          via: {
            channel: 'web',
            source: {
              from: {},
              to: {},
              rel: null,
            },
          },
        },
      },
    ],
    metadata: {
      system: {
        client: 'web',
        ip_address: '192.168.1.1',
        location: 'unknown',
        latitude: null,
        longitude: null,
      },
      custom: {},
    },
  },
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});

type AuthProps = {
  email: string;
  token: string;
  subdomain: string;
};

const polling: Polling<AuthProps, { ticket_id: string }> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const items = await getTicketAudits(auth, propsValue.ticket_id);
    return items.map((item) => ({
      id: item.id,
      data: item,
    }));
  },
};

async function getTicketAudits(authentication: AuthProps, ticket_id: string) {
  const { email, token, subdomain } = authentication;
  const response = await httpClient.sendRequest<{ audits: Array<{ id: number; [key: string]: unknown }> }>({
    url: `https://${subdomain}.zendesk.com/api/v2/tickets/${ticket_id}/audits.json?sort_order=desc&sort_by=created_at&per_page=50`,
    method: HttpMethod.GET,
    authentication: {
      type: AuthenticationType.BASIC,
      username: email + '/token',
      password: token,
    },
    timeout: 30000, // 30 seconds timeout
    retries: 3, // Retry up to 3 times on failure
  });
  return response.body.audits;
} 