import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

export const telegramGetChatMemberCount = createAction({
  auth: telegramBotAuth,
  name: 'telegram_get_chat_member_count',
  displayName: 'Get Chat Member Count',
  description: 'Get the number of members in a Telegram chat.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the number of members in a chat by chat_id (a numeric id or @channelusername). Use to size a group or channel before posting or to monitor membership; for per-user details use telegram_get_chat_member. Read-only.',
    idempotent: true,
  },
  props: {
    chat_id: telegramCommons.chatIdProp(),
  },
  async run(ctx) {
    try {
      const response = await httpClient.sendRequest<never>({
        method: HttpMethod.POST,
        url: telegramCommons.getApiUrl(ctx.auth, 'getChatMemberCount'),
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
