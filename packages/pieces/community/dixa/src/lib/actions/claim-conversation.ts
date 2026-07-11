import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { dixaAuth } from '../auth';
import { dixaClient } from '../common/client';
import {
  agentIdProp,
  conversationIdProp,
  endUserIdProp,
} from '../common/props';

export const claimConversation = createAction({
  auth: dixaAuth,
  name: 'claim_conversation',
  displayName: 'Claim Conversation',
  description:
    'Claims a conversation for a given agent. Set force to false to avoid taking over assigned conversations.',
  audience: 'both',
  aiMetadata: {
    description:
      'Assign a Dixa conversation to a specific agent. Use force=false to avoid overriding an existing assignment.',
    idempotent: false,
  },
  props: {
    endUserId: endUserIdProp(),
    conversationId: conversationIdProp,
    agentId: agentIdProp({
      description: 'The ID of the agent who is claiming the conversation.',
    }),
    force: Property.Checkbox({
      displayName: 'Force',
      description:
        'Set to false to avoid taking over the conversation if it is already assigned to an agent.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { conversationId, agentId, force } = propsValue;

    return await dixaClient.makeRequest(
      auth.secret_text,
      HttpMethod.PUT,
      `/conversations/${conversationId}/claim`,
      {
        agentId,
        force,
      }
    );
  },
});
