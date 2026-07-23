import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { telegramBotAuth } from '../..';
import { telegramCommons } from '../common';

export const telegramGetChatMember = createAction({
  auth: telegramBotAuth,
  name: 'telegram_get_chat_member',
  displayName: 'Get Chat Member',
  description: 'Get membership info for a user in a Telegram chat.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Looks up one user's membership in a chat by chat_id (a numeric id or @channelusername) and user_id, returning their status (member, administrator, creator, restricted, left, kicked) and permissions. Use to check whether a user belongs to a chat or what rights they hold before acting; to list all admins use telegram_get_chat_administrators. Read-only.",
    idempotent: true,
  },
  props: {
    chat_id: telegramCommons.chatIdProp(),
    user_id: Property.ShortText({
      displayName: 'User Id',
      description: 'Unique identifier for the user (e.g. from the New Message trigger payload).',
      required: true,
    }),
  },
  async run(ctx) {
    try {
      const response = await httpClient.sendRequest<never>({
        method: HttpMethod.POST,
        url: telegramCommons.getApiUrl(ctx.auth, 'getChatMember'),
        headers: {},
        body: {
          chat_id: ctx.propsValue.chat_id,
          user_id: ctx.propsValue.user_id,
        },
      });
      return response.body;
    } catch (error) {
      return (error as HttpError).errorMessage().response.body;
    }
  },
});
