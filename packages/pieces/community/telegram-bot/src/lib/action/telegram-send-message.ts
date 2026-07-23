import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

export const telegramSendMessage = createAction({
  auth: telegramBotAuth,
  name: 'telegram_send_message',
  displayName: 'Send Message',
  description: 'Send a text message to a Telegram chat, group, or channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Posts a text message to a Telegram chat, group, or channel addressed by chat_id (a numeric id or @channelusername the bot can reach — resolve via the New Message trigger payload\'s chat.id or telegram_get_chat). Use to deliver a notification, reply, or alert; for an attachment use telegram_send_document, for a photo/video use telegram_send_photo_or_video. Text is sent as plain text unless format is set; if you set MarkdownV2 or HTML the text must be correctly escaped or Telegram rejects it. reply_markup is an advanced raw inline-keyboard JSON object. Not idempotent: each call sends a new message.',
    idempotent: false,
  },
  props: {
    chat_id: telegramCommons.chatIdProp(),
    message: Property.LongText({
      displayName: 'Message',
      description: 'The text message to send.',
      required: true,
    }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      description:
        'How the message text should be parsed by Telegram. Defaults to plain text; only set MarkdownV2 or HTML when the text is correctly escaped/tagged.',
      required: false,
      options: {
        options: [
          { label: 'Plain Text', value: 'None' },
          { label: 'Markdown (V2)', value: 'MarkdownV2' },
          { label: 'HTML', value: 'HTML' },
        ],
      },
      defaultValue: 'None',
    }),
    message_thread_id: Property.ShortText({
      displayName: 'Message Thread Id',
      description:
        'Unique identifier for the target message thread of the forum; supergroup forums only.',
      required: false,
    }),
    web_page_preview: Property.Checkbox({
      displayName: 'Disable Web Page Preview',
      description: 'Disable link previews for links in this message.',
      required: false,
      defaultValue: false,
    }),
    disable_notification: telegramCommons.disableNotificationProp(),
    protect_content: telegramCommons.protectContentProp(),
    reply_to_message_id: telegramCommons.replyToMessageIdProp(),
    reply_markup: Property.Json({
      displayName: 'Reply Markup',
      description:
        'Advanced/optional. A raw JSON-serialized inline keyboard or reply keyboard, e.g. {"inline_keyboard":[[{"text":"Open","url":"https://example.com"}]]}. Malformed markup is rejected by Telegram.',
      required: false,
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
