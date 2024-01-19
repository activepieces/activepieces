import { httpClient, HttpMethod } from '@activepieces/pieces-common';
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
export const telegramCreateInviteLinkAction = createAction({
  auth: telegramBotAuth,
  name: 'create_invite_link',
  description: 'Create an invite link for a chat',
  displayName: 'Create Invite Link',
  props: {
    instructions: Property.MarkDown({
      value: chatId,
    }),
    chat_id: Property.ShortText({
      displayName: 'Chat Id',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the invite link (max 32 chars)',
      required: false,
    }),
    expire_date: Property.DateTime({
      displayName: 'Expire Date',
      description: 'Point in time when the link will expire',
      required: false,
    }),
    member_limit: Property.Number({
      displayName: 'Member Limit',
      description:
        'Maximum number of users that can be members of the chat simultaneously after joining the chat via this invite link; 1-99999',
      required: false,
    }),
  },
  async run(ctx) {
    return await httpClient
      .sendRequest<never>({
        method: HttpMethod.POST,
        url: telegramCommons.getApiUrl(ctx.auth, 'createChatInviteLink'),
        headers: {},
        body: {
          chat_id: ctx.propsValue.chat_id,
          name: ctx.propsValue.name ?? undefined,
          expire_date: ctx.propsValue.expire_date
            ? Math.floor(new Date(ctx.propsValue.expire_date).getTime() / 1000)
            : undefined,
          member_limit: ctx.propsValue.member_limit ?? undefined,
        },
      })
      .then((res) => res.body);
  },
});
