import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

export const telegramGetChatAdministrators = createAction({
  auth: telegramBotAuth,
  name: 'telegram_get_chat_administrators',
  displayName: 'Get Chat Administrators',
  description: 'List the administrators of a Telegram chat.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists the administrators of a chat by chat_id (a numeric id or @channelusername) — each admin's user, status (creator/administrator), and granted rights. Use to discover who can moderate a chat, or to find a user_id before checking one member with telegram_get_chat_member. Returns an empty list for private chats. Read-only.",
    idempotent: true,
  },
  props: {
    chat_id: telegramCommons.chatIdProp(),
  },
  async run(ctx) {
    try {
      const response = await httpClient.sendRequest<never>({
        method: HttpMethod.POST,
        url: telegramCommons.getApiUrl(ctx.auth, 'getChatAdministrators'),
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
