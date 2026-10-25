import { createAction } from '@activepieces/pieces-framework';

import { agentxAuth } from '../../auth';
import { agentxAiProps } from '../../common/ai-props';
import { agentxApi } from '../../common/api';

export const resetConversationContextAction = createAction({
  auth: agentxAuth,
  name: 'agentx_reset_conversation_context',
  displayName: 'Reset Conversation Context',
  description: 'Clears the memory context of an AgentX conversation.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Clears the memory context of an AgentX conversation (ID from List Conversations) so the agent forgets earlier turns; the conversation itself stays. The cleared context cannot be restored.',
    idempotent: true,
  },
  props: {
    conversationId: agentxAiProps.conversationId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await agentxApi.resetConversationContext({
      auth,
      conversationId: propsValue.conversationId,
    });
  },
});
