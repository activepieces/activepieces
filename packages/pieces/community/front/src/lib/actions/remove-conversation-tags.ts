import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { conversationIdDropdown } from '../common/dropdown';

export const removeConversationTags = createAction({
  auth: frontAuth,
  name: 'removeConversationTags',
  displayName: 'Remove Conversation Tags',
  description: 'Remove one or more tags from a conversation.',
  props: {
    conversation_id: conversationIdDropdown,
    tag_ids: Property.Array({
      displayName: 'Tag IDs',
      description: 'List of tag IDs to remove from the conversation.',
      required: true,
      properties: {
        item: Property.ShortText({ displayName: 'Tag ID', required: true }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { conversation_id, tag_ids } = propsValue;
    const path = `/conversations/${conversation_id}/tags`;
    const body = { tag_ids };
    return await makeRequest(auth, HttpMethod.DELETE, path, body);
  },
});
