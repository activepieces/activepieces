import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../..';

const WEBHOOK_TRIGGER_KEY = 'zendesk_updated_ticket_webhook';

type AuthProps = {
  email: string;
  token: string;
  subdomain: string;
};

interface ZendeskOrganization {
  id: number;
  name: string;
}

interface ZendeskTicket {
  id: number;
  subject: string;
  description: string;
  status: string;
  priority: string;
  organization_id?: number;
  requester_id: number;
  assignee_id?: number;
  created_at: string;
  updated_at: string;
}

export const updatedTicket = createTrigger({
  name: 'updated_ticket',
  displayName: 'Updated Ticket',
  description: 'Fires when an existing ticket is updated. Requires a Zendesk Trigger with Notify active webhook.',
  auth: zendeskAuth,
  props: {
    organization_id: Property.Dropdown({
      displayName: 'Organization (Optional)',
      description: 'Filter tickets by organization. Leave empty to trigger for all organizations.',
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
          const response = await httpClient.sendRequest<{ organizations: ZendeskOrganization[] }>({
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
              { label: 'All Organizations', value: 'all' },
              ...response.body.organizations.map((org: ZendeskOrganization) => ({
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
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    url: 'https://example.zendesk.com/api/v2/tickets/5.json',
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
    subject: 'Updated Subject',
    raw_subject: 'Updated Raw Subject',
    description: 'Updated Description',
    priority: 'high',
    status: 'pending',
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
    tags: ['updated'],
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
    audit: {
      id: 12345,
      ticket_id: 5,
      created_at: '2023-03-25T02:39:41Z',
      author_id: 8193592318236,
      events: [
        {
          id: 67890,
          type: 'Change',
          field_name: 'status',
          previous_value: 'open',
          value: 'pending',
        },
      ],
    },
  },
  async onEnable(context) {
    const authentication = context.auth as AuthProps;
    
    try {
      const response = await httpClient.sendRequest<{
        webhook: { id: string };
      }>({
        url: `https://${authentication.subdomain}.zendesk.com/api/v2/webhooks`,
        method: HttpMethod.POST,
        headers: {
          'Content-Type': 'application/json',
        },
        authentication: {
          type: AuthenticationType.BASIC,
          username: authentication.email + '/token',
          password: authentication.token,
        },
        body: {
          webhook: {
            name: `Activepieces Updated Ticket Webhook - ${Date.now()}`,
            endpoint: context.webhookUrl,
            http_method: 'POST',
            request_format: 'json',
            status: 'active',
            subscriptions: ['conditional_ticket_events'],
          },
        },
      });

      await context.store.put<string>(WEBHOOK_TRIGGER_KEY, response.body.webhook.id);
    } catch (error) {
      throw new Error(`Failed to register webhook: ${(error as Error).message}`);
    }
  },

  async onDisable(context) {
    const authentication = context.auth as AuthProps;
    const webhookId = await context.store.get<string>(WEBHOOK_TRIGGER_KEY);

    if (webhookId) {
      try {
        await httpClient.sendRequest({
          url: `https://${authentication.subdomain}.zendesk.com/api/v2/webhooks/${webhookId}`,
          method: HttpMethod.DELETE,
          authentication: {
            type: AuthenticationType.BASIC,
            username: authentication.email + '/token',
            password: authentication.token,
          },
        });
      } catch (error) {
        console.warn(`Warning: Failed to delete webhook ${webhookId}:`, (error as Error).message);
      } finally {
        await context.store.delete(WEBHOOK_TRIGGER_KEY);
      }
    }
  },

  async run(context) {
    const payload = context.payload.body as { ticket?: ZendeskTicket };
    if (!payload.ticket) {
      return [];
    }

    const ticket = payload.ticket;

    const organizationId = context.propsValue.organization_id;
    if (organizationId && organizationId !== 'all') {
      if (!ticket.organization_id || ticket.organization_id.toString() !== organizationId) {
        return [];
      }
    }

    return [ticket];
  },
});
