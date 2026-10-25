import { createAction, Property } from '@activepieces/pieces-framework';

import { agentxAuth } from '../../auth';
import { agentxAiProps } from '../../common/ai-props';
import { agentxApi } from '../../common/api';

export const addConversationContextAction = createAction({
  auth: agentxAuth,
  name: 'agentx_add_conversation_context',
  displayName: 'Add Conversation Context',
  description:
    'Adds messages to an AgentX conversation memory without triggering a reply.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds prior turns to the memory of an existing AgentX conversation (ID from Create Conversation or List Conversations) without the agent replying, to give it background before Send Message. Each call appends again.',
    idempotent: false,
  },
  props: {
    conversationId: agentxAiProps.conversationId({ required: true }),
    messages: Property.Json({
      displayName: 'Messages',
      description:
        'JSON array of turns, each an object with a single `user` or `assistant` key holding the text, e.g. [{"user": "My order is 1042"}, {"assistant": "Noted."}].',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { conversationId, messages } = propsValue;
    if (!Array.isArray(messages)) {
      throw new Error(
        'Messages must be a JSON array of {"user": "..."} or {"assistant": "..."} objects.'
      );
    }
    return await agentxApi.addConversationContext({
      auth,
      conversationId,
      messages,
    });
  },
});
