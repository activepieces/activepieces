import {
  TriggerStrategy,
  createTrigger,
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

export const newSuspendedTicket = createTrigger({
  auth: zendeskAuth,
  name: 'new_suspended_ticket',
  displayName: 'New Suspended Ticket',
  description: 'Triggers when a ticket is suspended. Suspended tickets auto-delete after 14 days.',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    id: 123456789,
    url: 'https://activepieceshelp.zendesk.com/api/v2/suspended_tickets/123456789.json',
    external_id: null,
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
    type: null,
    subject: 'Suspended Ticket Subject',
    raw_subject: 'Suspended Ticket Subject',
    description: 'This ticket was suspended due to spam',
    priority: null,
    status: 'suspended',
    recipient: null,
    requester_id: 8193592318236,
    submitter_id: 8193592318236,
    assignee_id: null,
    organization_id: 8193599387420,
    group_id: 8193569448092,
    collaborator_ids: [],
    follower_ids: [],
    email_cc_ids: [],
    forum_topic_id: null,
    problem_id: null,
    has_incidents: false,
    is_public: true,
    due_at: null,
    tags: [],
    custom_fields: [],
    satisfaction_rating: null,
    sharing_agreement_ids: [],
    custom_status_id: 8193592472348,
    fields: [],
    followup_ids: [],
    ticket_form_id: 8193569410076,
    brand_id: 8193583542300,
    allow_channelback: false,
    allow_attachments: true,
    from_messaging_channel: false,
    cause: 'spam',
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

const polling: Polling<AuthProps, Record<string, never>> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth }) => {
    const items = await getSuspendedTickets(auth);
    return items.map((item) => ({
      id: item.id,
      data: item,
    }));
  },
};

async function getSuspendedTickets(authentication: AuthProps) {
  const { email, token, subdomain } = authentication;
  const response = await httpClient.sendRequest<{ suspended_tickets: Array<{ id: number; [key: string]: unknown }> }>({
    url: `https://${subdomain}.zendesk.com/api/v2/suspended_tickets.json?sort_order=desc&sort_by=created_at&per_page=50`,
    method: HttpMethod.GET,
    authentication: {
      type: AuthenticationType.BASIC,
      username: email + '/token',
      password: token,
    },
    timeout: 30000, // 30 seconds timeout
    retries: 3, // Retry up to 3 times on failure
  });
  return response.body.suspended_tickets;
} 