import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { dixaAuth } from '../auth';
import { dixaClient } from '../common/client';
import {
  conversationIdProp,
  endUserIdProp,
  tagIdProp,
} from '../common/props';

export const tagConversation = createAction({
  auth: dixaAuth,
  name: 'tag_conversation',
  displayName: 'Tag Conversation',
  description: 'Adds a tag to a conversation.',
  audience: 'both',
  aiMetadata: {
    description:
      'Apply an existing Dixa tag to a conversation for categorization and routing.',
    idempotent: false,
  },
  props: {
    endUserId: endUserIdProp(),
    conversationId: conversationIdProp,
    tagId: tagIdProp,
  },
  async run({ auth, propsValue }) {
    const { conversationId, tagId } = propsValue;

    return await dixaClient.makeRequest(
      auth.secret_text,
      HttpMethod.PUT,
      `/conversations/${conversationId}/tags/${tagId}`
    );
  },
});
