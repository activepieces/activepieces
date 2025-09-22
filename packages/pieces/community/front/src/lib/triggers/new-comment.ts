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
    const params: string[] = ['q[types]=comment', 'limit=50'];
    if (propsValue.conversation_id) {
      params.push(
        `q[conversations]=${encodeURIComponent(
          propsValue.conversation_id as string
        )}`
      );
    }
    const query = params.join('&');
    const response = await makeRequest(
      auth as string,
      HttpMethod.GET,
      `/events?${query}`
    );
    const events = response._results || [];
    const comments: any[] = [];

    for (const event of events) {
      const emittedATMs = Math.floor(Number(event.emitted_at) * 1000);
      if (!lastFetchEpochMS || emittedATMs > lastFetchEpochMS) {
        comments.push({
          epochMilliSeconds: emittedATMs,
          data: event,
        });
      }
    }
    return comments;
  },
};

export const newComment = createTrigger({
  auth: frontAuth,
  name: 'newComment',
  displayName: 'New Comment',
  description: 'Fires when a new comment is posted on a conversation in Front.',
  props,
  sampleData: {
    _links: {
      self: 'https://example.api.frontapp.com/events/evt_67rwcqp4',
    },
    id: 'evt_67rwcqp4',
    type: 'archive',
    emitted_at: 1758533084,
    conversation: {
      _links: {
        self: 'https://example.api.frontapp.com/conversations/cnv_1jm05qco',
        related: {
          events:
            'https://example.api.frontapp.com/conversations/cnv_1jm05qco/events',
          followers:
            'https://example.api.frontapp.com/conversations/cnv_1jm05qco/followers',
          messages:
            'https://example.api.frontapp.com/conversations/cnv_1jm05qco/messages',
          comments:
            'https://example.api.frontapp.com/conversations/cnv_1jm05qco/comments',
          inboxes:
            'https://example.api.frontapp.com/conversations/cnv_1jm05qco/inboxes',
          last_message:
            'https://example.api.frontapp.com/messages/msg_326rsp60?referer=conversation',
        },
      },
      id: 'cnv_1jm05qco',
      subject: 'Re: test',
      status: 'archived',
      status_id: 'sts_695a7c',
      status_category: 'resolved',
      ticket_ids: ['SU-2'],
      assignee: {
        _links: {
          self: 'https://example.api.frontapp.com/teammates/tea_mfoko',
          related: {
            inboxes:
              'https://example.api.frontapp.com/teammates/tea_mfoko/inboxes',
            conversations:
              'https://example.api.frontapp.com/teammates/tea_mfoko/conversations',
          },
        },
        id: 'tea_mfoko',
        email: 'sanket@example.com',
        username: 'sanket',
        first_name: 'sanket',
        last_name: 'Nannaware',
        is_admin: true,
        is_available: true,
        is_blocked: false,
        type: 'user',
        custom_fields: {},
      },
      recipient: {
        _links: {
          related: {
            contact:
              'https://example.api.frontapp.com/contacts/crd_4x1iwyw',
          },
        },
        name: 'Sanket Nannaware',
        handle: 'sanketnannaware96@gmail.com',
        role: 'to',
      },
      tags: [
        {
          _links: {
            self: 'https://example.api.frontapp.com/tags/tag_6958vc',
            related: {
              conversations:
                'https://example.api.frontapp.com/tags/tag_6958vc/conversations',
              owner:
                'https://example.api.frontapp.com/teammates/tea_mfoko',
              parent_tag: null,
              children: null,
            },
          },
          id: 'tag_6958vc',
          name: 'Inbox',
          highlight: null,
          description: null,
          is_private: true,
          is_visible_in_conversation_lists: false,
          updated_at: 1758518633.403,
          created_at: 1758518633.403,
        },
        {
          _links: {
            self: 'https://example.api.frontapp.com/tags/tag_695n8o',
            related: {
              conversations:
                'https://example.api.frontapp.com/tags/tag_695n8o/conversations',
              owner: 'https://example.api.frontapp.com/teams/tim_8t9ew',
              parent_tag: null,
              children: null,
            },
          },
          id: 'tag_695n8o',
          name: 'YELLOW_STAR',
          highlight: null,
          description: null,
          is_private: false,
          is_visible_in_conversation_lists: false,
          updated_at: 1758532572.491,
          created_at: 1758531672.777,
        },
        {
          _links: {
            self: 'https://example.api.frontapp.com/tags/tag_695n6w',
            related: {
              conversations:
                'https://example.api.frontapp.com/tags/tag_fffff/conversations',
              owner: 'https://example.api.frontapp.com/teams/tim_8t9ew',
              parent_tag: null,
              children: null,
            },
          },
          id: 'tag_fffff',
          name: 'CHAT',
          highlight: null,
          description: null,
          is_private: false,
          is_visible_in_conversation_lists: false,
          updated_at: 1758532572.5,
          created_at: 1758531672.726,
        },
      ],
      links: [
        {
          _links: {
            self: 'https://example.api.frontapp.com/links/top_isetpk',
          },
          id: 'top_isetpk',
          name: 'test update link',
          type: 'web',
          external_url: 'https://example.com/',
          custom_fields: {},
        },
      ],
      custom_fields: {},
      created_at: 1758531757.285,
      waiting_since: 1758531945.646,
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
