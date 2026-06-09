import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ollabearAuth, ollabearRequest, coerceAuth } from './common';

const conversationIdProp = Property.ShortText({
  displayName: 'Conversation ID',
  description: 'The conversation UUID (e.g. from a trigger output).',
  required: true,
});

export const sendMessage = createAction({
  auth: ollabearAuth,
  name: 'send_message',
  displayName: 'Send Message',
  description: 'Post a message into a conversation (appears as an operator reply). Requires scope: messages_write.',
  props: {
    conversationId: conversationIdProp,
    content: Property.LongText({
      displayName: 'Message',
      description: 'Message body (max 4096 chars).',
      required: true,
    }),
    isInternal: Property.Checkbox({
      displayName: 'Internal note',
      description: 'If on, the message is an internal note (not shown to the visitor).',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { conversationId, content, isInternal } = context.propsValue;
    return ollabearRequest(
      coerceAuth(context.auth),
      HttpMethod.POST,
      `/conversations/${conversationId}/messages`,
      { content, is_internal: isInternal ?? false },
    );
  },
});

export const setStatus = createAction({
  auth: ollabearAuth,
  name: 'set_status',
  displayName: 'Set Conversation Status',
  description: 'Open or close a conversation. Requires scope: conversations_write.',
  props: {
    conversationId: conversationIdProp,
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: true,
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Closed', value: 'closed' },
        ],
      },
    }),
  },
  async run(context) {
    const { conversationId, status } = context.propsValue;
    return ollabearRequest(
      coerceAuth(context.auth),
      HttpMethod.PATCH,
      `/conversations/${conversationId}/status`,
      { status },
    );
  },
});

export const setTags = createAction({
  auth: ollabearAuth,
  name: 'set_tags',
  displayName: 'Set Conversation Tags',
  description: 'Replace the tags on a conversation. Requires scope: conversations_write.',
  props: {
    conversationId: conversationIdProp,
    tags: Property.Array({
      displayName: 'Tags',
      description: 'The full tag set (replaces existing tags).',
      required: true,
    }),
  },
  async run(context) {
    const { conversationId, tags } = context.propsValue;
    return ollabearRequest(
      coerceAuth(context.auth),
      HttpMethod.PATCH,
      `/conversations/${conversationId}/tags`,
      { tags: (tags as string[]) ?? [] },
    );
  },
});

export const getConversation = createAction({
  auth: ollabearAuth,
  name: 'get_conversation',
  displayName: 'Get Conversation',
  description: 'Fetch a single conversation by ID (status, subject, tags, metadata). Requires scope: conversations_read.',
  props: {
    conversationId: conversationIdProp,
  },
  async run(context) {
    const { conversationId } = context.propsValue;
    return ollabearRequest(
      coerceAuth(context.auth),
      HttpMethod.GET,
      `/conversations/${conversationId}`,
    );
  },
});
