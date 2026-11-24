import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellSchemas } from '../../common/schemas';
export const endChatAction = createAction({
  auth: retellAiAuth,
  name: 'end_chat',
  classification: 'DESTRUCTIVE',
  displayName: 'End Chat',
  description: 'Ends an ongoing chat.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Ends one ongoing Retell chat so no more messages can be sent and post-chat analysis starts. A chat cannot be reopened.',
    idempotent: false,
  },
  props: {
    chat_id: retellAiProps.id({ displayName: 'Chat ID', description: 'The chat to end.' }),
  },
  outputSchema: retellSchemas.chatEnded,
  async run({ auth, propsValue }) {
    const chatId = retellInput.seg({ value: propsValue.chat_id, label: 'Chat ID' });
    await retellApiCall({ apiKey: apiKeyOf(auth), method: HttpMethod.PATCH, path: `/end-chat/${chatId}` });
    return { chat_id: decodeURIComponent(chatId), ended: true };
  },
});
