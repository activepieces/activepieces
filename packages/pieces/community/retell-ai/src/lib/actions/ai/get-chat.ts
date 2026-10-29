import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
export const getChatAction = createAction({
  auth: retellAiAuth,
  name: 'get_chat',
  classification: 'READ',
  displayName: 'Get Chat',
  description: 'Returns one chat with transcript and analysis.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one Retell chat (web or SMS) with status, transcript, post-chat analysis and cost. Analysis appears after the chat ends. Read-only.',
    idempotent: true,
  },
  props: {
    chat_id: retellAiProps.id({ displayName: 'Chat ID', description: 'The chat ID.' }),
  },
  outputSchema: retellSchemas.chat,
  async run({ auth, propsValue }) {
    const chat = await retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.GET,
      path: `/get-chat/${retellInput.seg({ value: propsValue.chat_id, label: 'Chat ID' })}`,
      retryRateLimit: true,
    });
    return retellMap.chat(chat);
  },
});
