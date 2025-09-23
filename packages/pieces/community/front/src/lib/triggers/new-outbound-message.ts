import {
  createTrigger,
  TriggerStrategy,
  Property,
  PiecePropValueSchema,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';

const props = {
  inbox_id: Property.ShortText({
    displayName: 'Inbox ID',
    description: 'The ID of the inbox to monitor for new inbound messages.',
    required: false,
  }),
};

const polling: Polling<string, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    // Fetch outbound and out_reply message events
    let query = `q[types]=outbound`;
    if (propsValue.inbox_id) {
      query += `&q[inboxes]=${propsValue.inbox_id}`;
    }
    const limit = 15;
    const response = await makeRequest(
      auth as string,
      HttpMethod.GET,
      `/events?${query}&limit=${limit}`
    );
    const events = response._results || [];
    const outboundMessages: any[] = [];

    for (const event of events) {
      // Only include new events since last fetch
      const emittedAtMs = Math.floor(Number(event.emitted_at) * 1000);
      if (!lastFetchEpochMS || emittedAtMs > lastFetchEpochMS) {
        outboundMessages.push({
          epochMilliSeconds: emittedAtMs,
          data: event,
        });
      }
    }
    return outboundMessages;
  },
};

export const newOutboundMessage = createTrigger({
  auth: frontAuth,
  name: 'newOutboundMessage',
  displayName: 'New Outbound Message',
  description: 'Fires when a message is sent or replied to in Front.',
  props,
  sampleData: {
    _links: {
      self: 'https://api.example.com/events/evt_dummy1234',
    },
    id: 'evt_dummy1234',
    type: 'outbound',
    emitted_at: 1700000000,
    conversation: {
      _links: {
        self: 'https://api.example.com/conversations/cnv_dummy5678',
        related: {
          events: 'https://api.example.com/conversations/cnv_dummy5678/events',
          followers:
            'https://api.example.com/conversations/cnv_dummy5678/followers',
          messages:
            'https://api.example.com/conversations/cnv_dummy5678/messages',
          comments:
            'https://api.example.com/conversations/cnv_dummy5678/comments',
          inboxes:
            'https://api.example.com/conversations/cnv_dummy5678/inboxes',
          last_message:
            'https://api.example.com/messages/msg_dummy9012?referer=conversation',
        },
      },
      id: 'cnv_dummy5678',
      subject: 'unsubscribe',
      status: 'archived',
      status_id: 'sts_dummy0001',
      status_category: 'resolved',
      ticket_ids: [],
      assignee: null,
      recipient: {
        _links: {
          related: {
            contact: 'https://api.example.com/contacts/crd_dummy2222',
          },
        },
        name: '',
        handle: 'unsubscribe_dummy@example.com',
        role: 'to',
      },
      tags: [],
      links: [],
      custom_fields: {},
      created_at: 1700001000,
      waiting_since: 1700000000,
      is_private: false,
      scheduled_reminders: [],
      metadata: {},
    },
    source: {
      _meta: {
        type: 'inboxes',
      },
      data: [
        {
          _links: {
            self: 'https://api.example.com/inboxes/inb_dummy3333',
            related: {
              channels:
                'https://api.example.com/inboxes/inb_dummy3333/channels',
              conversations:
                'https://api.example.com/inboxes/inb_dummy3333/conversations',
              teammates:
                'https://api.example.com/inboxes/inb_dummy3333/teammates',
              owner: 'https://api.example.com/teams/tim_dummy4444',
            },
          },
          id: 'inb_dummy3333',
          name: 'Dummy Inbox',
          is_private: false,
          is_public: true,
          custom_fields: {},
          address: 'dummy@example.com',
          send_as: 'dummy@example.com',
          type: 'gmail',
        },
      ],
    },
    target: {
      _meta: {
        type: 'message',
      },
      data: {
        _links: {
          self: 'https://api.example.com/messages/msg_dummy9012',
          related: {
            conversation: 'https://api.example.com/conversations/cnv_dummy5678',
            message_seen: 'https://api.example.com/messages/msg_dummy9012/seen',
          },
        },
        id: 'msg_dummy9012',
        message_uid: 'dummyuid1234567890',
        type: 'email',
        is_inbound: false,
        created_at: 1700000000,
        blurb: 'This message was automatically generated.',
        body: 'This message was automatically generated.<br>',
        text: 'This message was automatically generated.\n',
        error_type: null,
        version: null,
        subject: 'unsubscribe',
        draft_mode: null,
        metadata: {},
        author: null,
        recipients: [
          {
            _links: {
              related: {
                contact: 'https://api.example.com/contacts/crd_dummy5555',
              },
            },
            name: 'Dummy Sender',
            handle: 'sender@example.com',
            role: 'from',
          },
          {
            _links: {
              related: {
                contact: 'https://api.example.com/contacts/crd_dummy2222',
              },
            },
            name: '',
            handle: 'unsubscribe_dummy@example.com',
            role: 'to',
          },
        ],
        attachments: [],
        signature: null,
        is_draft: false,
      },
    },
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },
  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
