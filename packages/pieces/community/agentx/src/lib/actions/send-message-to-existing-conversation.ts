import { createAction, Property } from '@activepieces/pieces-framework';
import { agentxAuth } from '../auth';
import { agentxApi } from '../common/api';
import { agentxProps } from '../common/props';

export const sendMessageToExistingConversationAction = createAction({
  auth: agentxAuth,
  name: 'sendMessageToExistingConversation',
  classification: 'WRITE',
  displayName: 'Send Message to Existing Conversation',
  description: 'Send a message to an existing conversation with an agent.',
  audience: 'both',
  aiMetadata: { description: 'Posts a message into an existing AgentX conversation (by conversation ID) and gets the agent reply, with a selectable response mode (chat or search) and an optional memory-context window controlling how many prior messages the agent considers. Use this to continue an already-created conversation; create the conversation first to obtain its ID. Each call appends a new message and produces a new reply (not idempotent).', idempotent: false },
  props: {
    agentId: agentxProps.agentId({ required: true }),
    conversationId: agentxProps.conversationId({ required: false }),
    agentMode: Property.StaticDropdown({
      displayName: 'Agent Mode',
      description: 'Choose how the agent should respond',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Chat', value: 'chat' },
          { label: 'Search', value: 'search' },
        ],
      },
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'The message you want to send to the agent.',
      required: true,
    }),
    context: Property.Number({
      displayName: 'Memory Context',
      description: 'Number of previous messages to include. 0 = as much as possible, 1 = only last message, etc.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { conversationId, agentMode, message, context } = propsValue;
    return await agentxApi.sendMessage({ auth, conversationId, agentMode, message, context });
  },
});
