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

export const updatedTicket = createTrigger({
  auth: zendeskAuth,
  name: 'updated_ticket',
  displayName: 'Updated Ticket',
  description: 'Triggers when an existing ticket is updated (Audit events)',
  type: TriggerStrategy.POLLING,
  props: {
    ticket_id: Property.ShortText({
      displayName: 'Ticket ID',
      description: 'The ID of the ticket to monitor for updates',
      required: true,
    }),
  },
  sampleData: {
    id: 123456,
    ticket_id: 5,
    type: 'Comment',
    public: true,
    body: 'Ticket was updated',
    html_body: '<p>Ticket was updated</p>',
    plain_body: 'Ticket was updated',
    author_id: 8193592318236,
    via: {
      channel: 'web',
      source: {
        from: {},
        to: {},
        rel: null,
      },
    },
    created_at: '2023-03-25T02:39:41Z',
    updated_at: '2023-03-25T02:39:41Z',
    metadata: {},
    file_attachments: [],
    uploads: [],
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
    url: `https://${subdomain}.zendesk.com/api/v2/tickets/${ticket_id}/audits.json?sort_order=desc&sort_by=created_at&per_page=200`,
    method: HttpMethod.GET,
    authentication: {
      type: AuthenticationType.BASIC,
      username: email + '/token',
      password: token,
    },
  });
  return response.body.audits;
} 