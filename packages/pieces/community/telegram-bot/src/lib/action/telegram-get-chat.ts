import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

export const telegramGetChat = createAction({
  auth: telegramBotAuth,
  name: 'telegram_get_chat',
  displayName: 'Get Chat',
  description: 'Get up-to-date information about a Telegram chat.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Looks up current details about a chat (title, description, type, photo, member count) by chat_id (a numeric id or @channelusername). Use to resolve or inspect a chat before acting on it, or to confirm the bot can reach it; the bot must be a member of or have access to the chat. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    chat_id: telegramCommons.chatIdProp(),
  },
  async run(ctx) {
    try {
      const response = await httpClient.sendRequest<never>({
        method: HttpMethod.POST,
        url: telegramCommons.getApiUrl(ctx.auth, 'getChat'),
        body: {
          chat_id: ctx.propsValue.chat_id,
        },
      });
      return response.body;
    } catch (error) {
      return (error as HttpError).errorMessage().response.body;
    }
  },
});
