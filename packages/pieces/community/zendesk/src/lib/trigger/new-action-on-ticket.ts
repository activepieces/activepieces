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

const WEBHOOK_TRIGGER_KEY = 'zendesk_ticket_action_webhook';

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

export const newActionOnTicket = createTrigger({
  name: 'new_action_on_ticket',
  displayName: 'New Action on Ticket',
  description: 'Fires when any audit/event occurs on a specific ticket (admin limited).',
  auth: zendeskAuth,
  props: {
    ticket_id: Property.Number({
      displayName: 'Ticket ID',
      description: 'The specific ticket ID to monitor for actions/events.',
      required: true,
    }),
    event_types: Property.StaticMultiSelectDropdown({
      displayName: 'Event Types to Monitor',
      description: 'Select which types of events to monitor. Leave empty to monitor all events.',
      required: false,
      options: {
        options: [
          { label: 'Comment', value: 'Comment' },
          { label: 'Change', value: 'Change' },
          { label: 'Create', value: 'Create' },
          { label: 'Notification', value: 'Notification' },
          { label: 'VoiceComment', value: 'VoiceComment' },
          { label: 'ChatComment', value: 'ChatComment' },
          { label: 'SMSComment', value: 'SMSComment' },
          { label: 'FacebookComment', value: 'FacebookComment' },
          { label: 'TwitterComment', value: 'TwitterComment' },
          { label: 'Push', value: 'Push' },
          { label: 'LogMeInTranscript', value: 'LogMeInTranscript' },
          { label: 'External', value: 'External' },
        ],
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
    subject: 'Sample Ticket with Action',
    raw_subject: 'Sample Ticket with Action',
    description: 'This ticket has activity',
    priority: 'normal',
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
    tags: ['monitored'],
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
          type: 'Comment',
          public: true,
          body: 'New comment added to the ticket',
          html_body: '<div>New comment added to the ticket</div>',
          plain_body: 'New comment added to the ticket',
          author_id: 8193592318236,
        },
        {
          id: 67891,
          type: 'Change',
          field_name: 'priority',
          previous_value: 'low',
          value: 'normal',
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
            name: `Activepieces Ticket Action Webhook - ${Date.now()}`,
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
    const payload = context.payload.body as {
      type?: string;
      ticket?: ZendeskTicket;
      audit?: {
        id: number;
        ticket_id: number;
        created_at: string;
        author_id: number;
        events: Array<{
          id: number;
          type: string;
          field_name?: string;
          previous_value?: string | number | boolean | string[];
          value?: string | number | boolean | string[];
          public?: boolean;
          body?: string;
          html_body?: string;
          plain_body?: string;
          author_id?: number;
        }>;
      };
    };
    
    // Check if this is for the specific ticket we're monitoring
    if (!payload.ticket || !payload.audit) {
      return [];
    }

    const targetTicketId = context.propsValue.ticket_id;
    if (payload.ticket.id !== targetTicketId) {
      return [];
    }

    // Filter by event types if specified
    const selectedEventTypes = context.propsValue.event_types as string[] | undefined;
    if (selectedEventTypes && selectedEventTypes.length > 0) {
      const hasMatchingEvent = payload.audit.events.some(event => 
        selectedEventTypes.includes(event.type)
      );
      
      if (!hasMatchingEvent) {
        return [];
      }
    }

    // Include full audit information and event details
    const result: Record<string, unknown> = {
      ...payload.ticket,
      audit: payload.audit,
      event_count: payload.audit.events.length,
      event_types_in_audit: [...new Set(payload.audit.events.map(event => event.type))],
    };

    return [result];
  },
});
