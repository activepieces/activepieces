import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { dixaAuth } from '../auth';
import { dixaClient } from '../common/client';
import { conversationIdProp, endUserIdProp } from '../common/props';

export const getConversation = createAction({
  auth: dixaAuth,
  name: 'get_conversation',
  displayName: 'Get Conversation',
  description: 'Gets a conversation by ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch full details for a Dixa conversation, including metadata and custom attributes.',
    idempotent: true,
  },
  props: {
    endUserId: endUserIdProp(),
    conversationId: conversationIdProp,
  },
  async run({ auth, propsValue }) {
    const { conversationId } = propsValue;

    return await dixaClient.makeRequest(
      auth.secret_text,
      HttpMethod.GET,
      `/conversations/${conversationId}`
    );
  },
});
