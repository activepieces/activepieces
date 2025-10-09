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

const WEBHOOK_TRIGGER_KEY = 'zendesk_tag_added_webhook';

type AuthProps = {
  email: string;
  token: string;
  subdomain: string;
};

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
  tags: string[];
}

export const tagAddedToTicket = createTrigger({
  name: 'tag_added_to_ticket',
  displayName: 'Tag Added to Ticket',
  description: 'Fires when a ticket update includes the specified tag. Requires a Zendesk Trigger with Notify active webhook.',
  auth: zendeskAuth,
  props: {
    specific_tag: Property.ShortText({
      displayName: 'Specific Tag (Optional)',
      description: 'Only trigger when this specific tag is added. Leave empty to trigger for any tag addition.',
      required: false,
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
    subject: 'Ticket with new tag',
    raw_subject: 'Ticket with new tag',
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
    tags: ['urgent', 'priority'],
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
          field_name: 'tags',
          previous_value: ['urgent'],
          value: ['urgent', 'priority'],
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
            name: `Activepieces Tag Added Webhook - ${Date.now()}`,
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

    const specificTag = context.propsValue.specific_tag as string | undefined;
    const tags = payload.ticket.tags || [];

    if (specificTag) {
      if (!tags.includes(specificTag)) {
        return [];
      }
    } else if (!Array.isArray(tags) || tags.length === 0) {
      return [];
    }

    return [payload.ticket];
  },
});
