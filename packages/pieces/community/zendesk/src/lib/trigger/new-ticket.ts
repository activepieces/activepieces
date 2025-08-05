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

export const newTicket = createTrigger({
  auth: zendeskAuth,
  name: 'new_ticket',
  displayName: 'New Ticket',
  description: 'Triggers when a new ticket is created (optionally filtered by organization)',
  type: TriggerStrategy.POLLING,
  props: {
    organization_id: Property.Dropdown({
      displayName: 'Organization (Optional)',
      description: 'Filter tickets by organization. Leave empty to monitor all tickets.',
      refreshers: [],
      required: false,
      options: async ({ auth }) => {
        const authentication = auth as AuthProps;
        if (
          !authentication?.['email'] ||
          !authentication?.['subdomain'] ||
          !authentication?.['token']
        ) {
          return {
            placeholder: 'Fill your authentication first',
            disabled: true,
            options: [],
          };
        }
        try {
          const response = await httpClient.sendRequest<{ organizations: Array<{ id: number; name: string }> }>({
            url: `https://${authentication.subdomain}.zendesk.com/api/v2/organizations.json`,
            method: HttpMethod.GET,
            authentication: {
              type: AuthenticationType.BASIC,
              username: authentication.email + '/token',
              password: authentication.token,
            },
          });
          return {
            placeholder: 'Select an organization (optional)',
            options: [
              { label: 'All Organizations', value: '' },
              ...response.body.organizations.map((org: { id: number; name: string }) => ({
                label: org.name,
                value: org.id.toString(),
              })),
            ],
          };
        } catch (error) {
          return {
            placeholder: 'Error loading organizations',
            disabled: true,
            options: [],
          };
        }
      },
    }),
  },
  sampleData: {
    url: 'https://activepieceshelp.zendesk.com/api/v2/tickets/5.json',
    id: 5,
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
    subject: 'Subject',
    raw_subject: 'Raw Subject',
    description: 'Description',
    priority: null,
    status: 'open',
    recipient: null,
    requester_id: 8193592318236,
    submitter_id: 8193592318236,
    assignee_id: 8193592318236,
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

const polling: Polling<AuthProps, { organization_id?: string }> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const items = await getTickets(auth, propsValue.organization_id);
    return items.map((item) => ({
      id: item.id,
      data: item,
    }));
  },
};

async function getTickets(authentication: AuthProps, organization_id?: string) {
  const { email, token, subdomain } = authentication;
  let url = `https://${subdomain}.zendesk.com/api/v2/tickets.json?sort_order=desc&sort_by=created_at&per_page=200`;
  
  if (organization_id) {
    url += `&organization_id=${organization_id}`;
  }
  
  const response = await httpClient.sendRequest<{ tickets: Array<{ id: number; [key: string]: unknown }> }>({
    url,
    method: HttpMethod.GET,
    authentication: {
      type: AuthenticationType.BASIC,
      username: email + '/token',
      password: token,
    },
  });
  return response.body.tickets;
} 