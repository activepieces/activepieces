import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { dixaAuth } from '../auth';
import { dixaClient } from '../common/client';
import {
  agentIdProp,
  conversationIdProp,
  endUserIdProp,
} from '../common/props';

export const closeConversation = createAction({
  auth: dixaAuth,
  name: 'close_conversation',
  displayName: 'Close Conversation',
  description: 'Mark a conversation as closed by providing its ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Close an open Dixa conversation. Optionally specify an agent to perform the close action.',
    idempotent: false,
  },
  props: {
    endUserId: endUserIdProp(),
    conversationId: conversationIdProp,
    agentId: agentIdProp({
      description: 'An optional agent/admin to close the conversation.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { conversationId, agentId } = propsValue;

    return await dixaClient.makeRequest(
      auth.secret_text,
      HttpMethod.PUT,
      `/conversations/${conversationId}/close`,
      {
        agentId,
      }
    );
  },
});
