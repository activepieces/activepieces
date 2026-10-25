import { createAction, Property } from '@activepieces/pieces-framework';

import { agentxAuth } from '../../auth';
import { agentxAiProps } from '../../common/ai-props';
import { agentxApi } from '../../common/api';

export const sendMessageAction = createAction({
  auth: agentxAuth,
  name: 'agentx_send_message',
  displayName: 'Send Message',
  description:
    'Sends a message to an AgentX conversation and returns the agent reply.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Sends a text message into an existing AgentX conversation (ID from Create Conversation or List Conversations) and returns each agent's reply with its message and trace IDs. Every call adds a new message and reply.",
    idempotent: false,
  },
  props: {
    conversationId: agentxAiProps.conversationId({ required: true }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'The message text to send.',
      required: true,
    }),
    agentMode: Property.StaticDropdown({
      displayName: 'Agent Mode',
      description:
        'How the agent answers: chat or search. Leave empty for the agent default.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Chat', value: 'chat' },
          { label: 'Search', value: 'search' },
        ],
      },
    }),
    context: agentxAiProps.context({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { conversationId, message, agentMode, context } = propsValue;
    return await agentxApi.sendMessage({
      auth,
      conversationId,
      agentMode,
      message,
      context,
    });
  },
});
