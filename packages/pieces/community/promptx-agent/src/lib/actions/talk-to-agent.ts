import { createAction, Property } from '@activepieces/pieces-framework';
import { promptxAuth } from '../common/auth';
import { getAgentXToken, postChatMessage } from '../common/helper';
import { PromptXAuthType } from '../common/types';

export const talkToAgent = createAction({
  auth: promptxAuth,
  name: 'talkToAgent',
  displayName: 'Talk to Agent',
  description: 'Talk to your agent pre-configured in AgentX',
  props: {
    conversationId: Property.ShortText({
      displayName: 'Conversation',
      description: 'Conversation ID to continue your talk with the agent',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { message, conversationId } = propsValue;
    const promptXAuth = auth as PromptXAuthType;
    const agentXToken = await getAgentXToken(promptXAuth);
    const chatResponse = await postChatMessage(
      { ...promptXAuth, agentXToken },
      conversationId,
      message
    );
    return chatResponse;
  },
});
