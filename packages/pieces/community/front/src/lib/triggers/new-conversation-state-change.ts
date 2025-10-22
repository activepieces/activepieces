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

import { conversationIdDropdown } from '../common/dropdown';

const props = {
  conversation_id: conversationIdDropdown,
  desired_state: Property.StaticDropdown({
    displayName: 'Desired State',
    description:
      'The state to trigger on (e.g., open, archived, deleted, assigned, etc.).',
    required: true,
    options: {
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Archived', value: 'archived' },
        { label: 'Deleted', value: 'deleted' },
        { label: 'Assigned', value: 'assigned' },
        { label: 'Unassigned', value: 'unassigned' },
      ],
    },
  }),
};
const polling: Polling<string, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { conversation_id, desired_state } = propsValue;
    const conv = await makeRequest(
      auth as unknown as string,
      HttpMethod.GET,
      `/conversations/${conversation_id}`
    );
    const stateChangedAt = conv.updated_at
      ? Math.floor(Number(conv.updated_at) * 1000)
      : null;

    // Only emit if the state matches and it's new since last poll
    if (
      conv.status === desired_state &&
      stateChangedAt !== null &&
      (!lastFetchEpochMS || stateChangedAt > lastFetchEpochMS)
    ) {
      return [
        {
          epochMilliSeconds: stateChangedAt,
          data: conv,
        },
      ];
    }
    return [];
  },
};

export const newConversationStateChange = createTrigger({
  auth: frontAuth,
  name: 'newConversationStateChange',
  displayName: 'New Conversation State Change',
  description: 'Triggers when a conversation changes to a specified state.',
  props,
  sampleData: {
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
          'https://example.api.frontapp.com/messages/msg_326rt3vs?referer=conversation',
      },
    },
    id: 'cnv_1jm05qco',
    subject: 'Re: test',
    status: 'assigned',
    status_id: 'sts_695a3s',
    status_category: 'open',
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
      email: 'jon@example.com',
      username: 'jon',
      first_name: 'jon',
      last_name: 'deo',
      is_admin: true,
      is_available: true,
      is_blocked: false,
      type: 'user',
      custom_fields: {},
    },
    recipient: {
      _links: {
        related: {
          contact: 'https://example.api.frontapp.com/contacts/crd_4x1iwyw',
        },
      },
      name: 'jon deo',
      handle: 'jondeo@gmail.com',
      role: 'to',
    },
    tags: [
      {
        _links: {
          self: 'https://example.api.frontapp.com/tags/tag_6958vc',
          related: {
            conversations:
              'https://example.api.frontapp.com/tags/tag_6958vc/conversations',
            owner: 'https://example.api.frontapp.com/teammates/tea_mfoko',
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
              'https://example.api.frontapp.com/tags/tag_695n6w/conversations',
            owner: 'https://example.api.frontapp.com/teams/tim_8t9ew',
            parent_tag: null,
            children: null,
          },
        },
        id: 'tag_695n6w',
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
    waiting_since: 1758534767,
    is_private: false,
    scheduled_reminders: [],
    metadata: {},
  },
  type: TriggerStrategy.POLLING,

  async test(context) {
    const { store, auth, propsValue, files } = context;
    return await pollingHelper.test(polling, {
      store,
      auth,
      propsValue,
      files,
    });
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
    const { store, auth, propsValue, files } = context;
    return await pollingHelper.poll(polling, {
      store,
      auth,
      propsValue,
      files,
    });
  },
});
