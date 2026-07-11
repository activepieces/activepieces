import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { dixaAuth } from '../auth';
import { dixaClient } from '../common/client';
import { conversationIdProp, endUserIdProp } from '../common/props';

export const listMessages = createAction({
  auth: dixaAuth,
  name: 'list_messages',
  displayName: 'List Messages',
  description: 'Lists messages from a conversation.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieve all messages in a Dixa conversation, including inbound, outbound, and internal messages.',
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
      `/conversations/${conversationId}/messages`
    );
  },
});
