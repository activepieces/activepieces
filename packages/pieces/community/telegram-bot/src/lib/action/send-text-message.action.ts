import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

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
export const telegramSendMessageAction = createAction({
  auth: telegramBotAuth,
  name: 'send_text_message',
  description: 'Send a message through a Telegram bot',
  displayName: 'Send Text Message',
  props: {
    instructions: Property.MarkDown({
      value: chatId,
    }),
    chat_id: Property.ShortText({
      displayName: 'Chat Id',
      required: true,
    }),
    message_thread_id: Property.ShortText({
      displayName: 'Message Thread Id',
      description:
        'Unique identifier for the target message thread of the forums; for forums supergroups only',
      required: false,
    }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      description: 'Choose format you want ',
      required: false,
      options: {
        options: [
          {
            label: 'Markdown',
            value: 'MarkdownV2',
          },
          {
            label: 'HTML',
            value: 'HTML',
          },
        ],
      },
      defaultValue: 'MarkdownV2',
    }),
    instructions_format: Property.MarkDown({
      value: format,
    }),
    web_page_preview: Property.Checkbox({
      displayName: 'Disable Web Page Preview',
      description: 'Disable link previews for links in this message',
      required: false,
      defaultValue: false,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'The message to be sent',
      required: true,
    }),
    reply_markup: Property.Json({
      required: false,
      displayName: 'Reply Markup',
      description:
        'Additional interface options. A JSON-serialized object for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user. Use special actions such as Build Inline Keyboard to generate this JSON object.',
    }),
  },
  async run(ctx) {
    return await httpClient.sendRequest<never>({
      method: HttpMethod.POST,
      url: telegramCommons.getApiUrl(ctx.auth, 'sendMessage'),
      body: {
        chat_id: ctx.propsValue['chat_id'],
        text: ctx.propsValue['message'],
        message_thread_id: ctx.propsValue['message_thread_id'] ?? undefined,
        parse_mode: ctx.propsValue['format'] ?? 'MarkdownV2',
        reply_markup: ctx.propsValue['reply_markup'] ?? undefined,
        disable_web_page_preview: ctx.propsValue['web_page_preview'] ?? false,
      },
    });
  },
});
