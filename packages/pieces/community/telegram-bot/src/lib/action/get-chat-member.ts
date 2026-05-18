import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { telegramBotAuth } from '../..';
import { telegramCommons } from '../common';

const chatId = `
**How to obtain Chat ID:**
1. Search for the bot "@getmyid_bot" in Telegram.
2. Start a conversation with the bot.
3. Send the command "/my_id" to the bot.
4. The bot will reply with your chat ID.

**Note: Remember to initiate the chat with the bot, or you'll get an error for "chat not found.**
`;
const format = `
[Link example](https://core.telegram.org/bots/api#formatting-options)
`;
export const telegramGetChatMemberAction = createAction({
  auth: telegramBotAuth,
  name: 'get_chat_member',
  description: 'Get member info (or null) for provided chat id and user id',
  displayName: 'Get Chat Member',
  props: {
    instructions: Property.MarkDown({
      value: chatId,
    }),
    chat_id: Property.ShortText({
      displayName: 'Chat Id',
      required: true,
    }),
    user_id: Property.ShortText({
      displayName: 'User Id',
      description: 'Unique identifier for the user',
      required: true,
    }),
  },
  async run(ctx) {
    try {
      return await httpClient
        .sendRequest<never>({
          method: HttpMethod.POST,
          url: telegramCommons.getApiUrl(ctx.auth, 'getChatMember'),
          headers: {},
          body: {
            chat_id: ctx.propsValue.chat_id,
            user_id: ctx.propsValue.user_id,
          },
        })
        .then((res) => res.body);
    } catch (error) {
      return (error as HttpError).errorMessage().response.body;
    }
  },
});
