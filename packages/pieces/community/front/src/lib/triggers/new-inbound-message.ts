import {
  createTrigger,
  TriggerStrategy,
  Property,
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
    let query = `q[types]=inbound`;
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
    const inboundMessages: any[] = [];

    for (const event of events) {
      // Only include new events since last fetch
      const emittedAtMs = Math.floor(Number(event.emitted_at) * 1000);
      if (!lastFetchEpochMS || emittedAtMs > lastFetchEpochMS) {
        inboundMessages.push({
          epochMilliSeconds: emittedAtMs,
          data: event,
        });
      }
    }
    return inboundMessages;
  },
};

export const newInboundMessage = createTrigger({
  auth: frontAuth,
  name: 'newInboundMessage',
  displayName: 'New Inbound Message',
  description: 'Fires when a new message is received in a shared inbox.',
  props,
  sampleData: {
    _links: {
      self: 'https://api.example.com/events/evt_dummy1234',
    },
    id: 'evt_dummy1234',
    type: 'inbound',
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
      subject: 'dummy subject',
      status: 'open',
      status_id: 'sts_dummy0001',
      status_category: 'unresolved',
      ticket_ids: ['tkt_dummy1111'],
      assignee: 'John Doe',
      recipient: {
        _links: {
          related: {
            contact: 'https://api.example.com/contacts/crd_dummy2222',
          },
        },
        name: 'Jane Doe',
        handle: 'jane.doe@example.com',
        role: 'to',
      },
      tags: ['urgent', 'test'],
      links: ['https://example.com'],
      custom_fields: {
        priority: 'high',
      },
      created_at: 1700001000,
      waiting_since: 1700000500,
      is_private: false,
      scheduled_reminders: [1700002000],
      metadata: {
        source: 'API',
      },
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
          is_private: true,
          is_public: false,
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
        is_inbound: true,
        created_at: 1700000100,
        blurb: 'This is a dummy message generated for testing.',
        body: 'This is a dummy message body.<br>',
        text: 'This is a dummy message text.\n',
        error_type: null,
        version: '1.0',
        subject: 'dummy message subject',
        draft_mode: false,
        metadata: {
          importance: 'low',
        },
        author: {
          name: 'Dummy Sender',
          email: 'sender@example.com',
        },
        recipients: [
          {
            _links: {
              related: {
                contact: 'https://api.example.com/contacts/crd_dummy5555',
              },
            },
            name: 'Recipient One',
            handle: 'recipient1@example.com',
            role: 'from',
          },
          {
            _links: {
              related: {
                contact: 'https://api.example.com/contacts/crd_dummy6666',
              },
            },
            name: 'Recipient Two',
            handle: 'recipient2@example.com',
            role: 'to',
          },
        ],
        attachments: ['file1.pdf', 'image1.png'],
        signature: 'Best regards, Dummy Sender',
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
