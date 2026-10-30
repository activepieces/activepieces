import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
export const sendChatMessageAction = createAction({
  auth: retellAiAuth,
  name: 'send_chat_message',
  classification: 'WRITE',
  displayName: 'Send Chat Message',
  description: 'Sends a user message to a chat and returns the agent reply.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sends one user message to an ongoing Retell chat and returns the agent reply messages generated for it. Billed per message; each run adds another turn to the conversation, so do not retry a turn that succeeded.',
    idempotent: false,
  },
  props: {
    chat_id: retellAiProps.id({ displayName: 'Chat ID', description: 'chat_id returned by Create Chat.' }),
    content: Property.LongText({ displayName: 'Message', description: 'The user message text.', required: true }),
  },
  outputSchema: retellSchemas.chatCompletion,
  async run({ auth, propsValue }) {
    const completion = await retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.POST,
      path: '/create-chat-completion',
      body: {
        chat_id: retellInput.requiredText({ value: propsValue.chat_id, label: 'Chat ID' }),
        content: retellInput.requiredText({ value: propsValue.content, label: 'Message' }),
      },
      timeoutMs: 120000,
    });
    return retellMap.chatCompletion(completion);
  },
});
