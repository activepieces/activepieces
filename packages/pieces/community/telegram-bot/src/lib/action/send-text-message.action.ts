import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

export const telegramSendMessageAction = createAction({
  auth: telegramBotAuth,
  name: 'send_text_message',
  description: 'Send a text message through a Telegram bot',
  audience: 'both',
  aiMetadata: { description: 'Posts a text message to a Telegram chat, group, or channel via the bot, addressed by chat_id (numeric id or @channelusername the bot can reach). Use to deliver notifications, replies, or alerts; supports Markdown/HTML formatting and inline keyboards. Not idempotent: each call sends a new message.', idempotent: false },
  displayName: 'Send Text Message',
  props: {
    instructions: telegramCommons.chatIdInstructions(),
    chat_id: telegramCommons.chatIdProp(),
    message_thread_id: telegramCommons.messageThreadIdProp(),
    format: telegramCommons.parseModeProp(),
    instructions_format: telegramCommons.formatLinkInstructions(),
    web_page_preview: Property.Checkbox({
      displayName: 'Disable Web Page Preview',
      description: 'Disable link previews for links in this message.',
      required: false,
      defaultValue: false,
    }),
    disable_notification: telegramCommons.disableNotificationProp(),
    protect_content: telegramCommons.protectContentProp(),
    reply_to_message_id: telegramCommons.replyToMessageIdProp(),
    message: Property.LongText({
      displayName: 'Message',
      description: 'The message to be sent',
      required: true,
    }),
    reply_markup: telegramCommons.replyMarkupProp(),
  },
  async run(ctx) {
    return await httpClient.sendRequest<never>({
      method: HttpMethod.POST,
      url: telegramCommons.getApiUrl(ctx.auth, 'sendMessage'),
      body: {
        chat_id: ctx.propsValue['chat_id'],
        text: ctx.propsValue['message'],
        message_thread_id: ctx.propsValue['message_thread_id'] ?? undefined,
        parse_mode: telegramCommons.resolveParseMode(ctx.propsValue['format']),
        reply_markup: ctx.propsValue['reply_markup'] ?? undefined,
        disable_web_page_preview: ctx.propsValue['web_page_preview'] ?? false,
        disable_notification: ctx.propsValue['disable_notification'] ?? false,
        protect_content: ctx.propsValue['protect_content'] ?? false,
        reply_to_message_id: ctx.propsValue['reply_to_message_id'] ?? undefined,
      },
    });
  },
});
