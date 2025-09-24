import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
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
import { conversationIdDropdown } from '../common/dropdown';

const props = {
  conversation_id: conversationIdDropdown,
};

const polling: Polling<string, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const params: string[] = ['q[types]=tag', 'limit=50'];
    const query = params.join('&');
    const response = await makeRequest(
      auth as string,
      HttpMethod.GET,
      `/events?${query}`
    );
    const events = response._results || [];
    const tagEvents: any[] = [];

    for (const event of events) {
      if (
        event.conversation &&
        event.conversation.id === propsValue.conversation_id &&
        event.type === 'tag'
      ) {
        const emittedAtMs = Math.floor(Number(event.emitted_at) * 1000);
        if (!lastFetchEpochMS || emittedAtMs > lastFetchEpochMS) {
          tagEvents.push({
            epochMilliSeconds: emittedAtMs,
            data: event,
          });
        }
      }
    }
    return tagEvents;
  },
};

export const newTagAddedToMessage = createTrigger({
  auth: frontAuth,
  name: 'newTagAddedToMessage',
  displayName: 'New Tag Added to Message',
  description: 'Fires when a tag is applied to a conversation.',
  props,
  sampleData: {
    _links: {
      self: 'https://api.example.com/events/evt_dummy1234',
    },
    id: 'evt_dummy1234',
    type: 'tag',
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
      subject: 'Re: test',
      status: 'assigned',
      status_id: 'sts_dummy0001',
      status_category: 'open',
      ticket_ids: ['SU-2'],
      assignee: {
        _links: {
          self: 'https://api.example.com/teammates/tea_dummy1',
          related: {
            inboxes: 'https://api.example.com/teammates/tea_dummy1/inboxes',
            conversations:
              'https://api.example.com/teammates/tea_dummy1/conversations',
          },
        },
        id: 'tea_dummy1',
        email: 'dummy.sender@example.com',
        username: 'dummyuser',
        first_name: 'Dummy',
        last_name: 'User',
        is_admin: true,
        is_available: true,
        is_blocked: false,
        type: 'user',
        custom_fields: {},
      },
      recipient: {
        _links: {
          related: {
            contact: 'https://api.example.com/contacts/crd_dummy2222',
          },
        },
        name: 'Dummy Recipient',
        handle: 'recipient@example.com',
        role: 'to',
      },
      tags: [
        {
          _links: {
            self: 'https://api.example.com/tags/tag_dummy1',
            related: {
              conversations:
                'https://api.example.com/tags/tag_dummy1/conversations',
              owner: 'https://api.example.com/teammates/tea_dummy1',
              parent_tag: null,
              children: null,
            },
          },
          id: 'tag_dummy1',
          name: 'Inbox',
          highlight: null,
          description: null,
          is_private: true,
          is_visible_in_conversation_lists: false,
          updated_at: 1700000100,
          created_at: 1700000100,
        },
        {
          _links: {
            self: 'https://api.example.com/tags/tag_dummy2',
            related: {
              conversations:
                'https://api.example.com/tags/tag_dummy2/conversations',
              owner: 'https://api.example.com/teams/team_dummy1',
              parent_tag: null,
              children: null,
            },
          },
          id: 'tag_dummy2',
          name: 'YELLOW_STAR',
          highlight: null,
          description: null,
          is_private: false,
          is_visible_in_conversation_lists: false,
          updated_at: 1700000200,
          created_at: 1700000150,
        },
        {
          _links: {
            self: 'https://api.example.com/tags/tag_dummy3',
            related: {
              conversations:
                'https://api.example.com/tags/tag_dummy3/conversations',
              owner: 'https://api.example.com/teams/team_dummy1',
              parent_tag: null,
              children: null,
            },
          },
          id: 'tag_dummy3',
          name: 'CHAT',
          highlight: null,
          description: null,
          is_private: false,
          is_visible_in_conversation_lists: false,
          updated_at: 1700000250,
          created_at: 1700000150,
        },
      ],
      links: [
        {
          _links: {
            self: 'https://api.example.com/links/link_dummy1',
          },
          id: 'link_dummy1',
          name: 'test update link',
          type: 'web',
          external_url: 'https://example.com/',
          custom_fields: {},
        },
      ],
      custom_fields: {},
      created_at: 1700000050,
      waiting_since: 1700000500,
      is_private: false,
      scheduled_reminders: [],
      metadata: {},
    },
    source: {
      _meta: {
        type: 'api',
      },
      data: null,
    },
    target: {
      _meta: {
        type: 'tag',
      },
      data: {
        _links: {
          self: 'https://api.example.com/tags/tag_dummy3',
          related: {
            conversations:
              'https://api.example.com/tags/tag_dummy3/conversations',
            owner: 'https://api.example.com/teams/team_dummy1',
            parent_tag: null,
            children: null,
          },
        },
        id: 'tag_dummy3',
        name: 'CHAT',
        highlight: null,
        description: null,
        is_private: false,
        is_visible_in_conversation_lists: false,
        updated_at: 1700000250,
        created_at: 1700000150,
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
