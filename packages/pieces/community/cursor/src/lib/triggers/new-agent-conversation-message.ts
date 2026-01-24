import { createTrigger, TriggerStrategy, PiecePropValueSchema, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';
import { cursorAuth } from '../common/auth';
import { makeCursorRequest } from '../common/client';
import { agentDropdown } from '../common/props';

interface ConversationMessage {
  id: string;
  type: 'user_message' | 'assistant_message';
  text: string;
}

interface AgentConversationResponse {
  messages: ConversationMessage[];
}

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof cursorAuth>,
  { agentId: string }
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue, lastItemId }) => {
    const { agentId } = propsValue;

    try {
      const response = await makeCursorRequest<AgentConversationResponse>(
        auth,
        `/v0/agents/${agentId}/conversation`,
        HttpMethod.GET
      );

      if (!response.messages || response.messages.length === 0) {
        return [];
      }

      const messages = [...response.messages].reverse();

      return messages.map((message) => ({
        id: message.id,
        data: message,
      }));
    } catch (error) {
      return [];
    }
  },
};

export const newAgentConversationMessageTrigger = createTrigger({
  auth: cursorAuth,
  name: 'new_agent_conversation_message',
  displayName: 'New Agent Conversation Message',
  description: 'Triggers when a new message appears in a specific agent\'s conversation',
  type: TriggerStrategy.POLLING,
  props: {
    agentId: agentDropdown,
  },
  sampleData: {
    id: 'msg_001',
    type: 'user_message',
    text: 'Add a README.md file with installation instructions',
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },
  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },
  async test(context) {
    const { store, auth, propsValue, files } = context;
    return await pollingHelper.test(polling, { store, auth, propsValue, files });
  },
  async run(context) {
    const { store, auth, propsValue, files } = context;
    return await pollingHelper.poll(polling, { store, auth, propsValue, files });
  },
});

