import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';
import { sendTextMessageActionOutputSchema } from '../output-schemas';

export const telegramSendMessageAction = createAction({
  auth: telegramBotAuth,
  name: 'send_text_message',
  classification: 'WRITE',
  description: 'Send a text message to a chat, group or channel.',
  audience: 'human',
  aiMetadata: { description: 'Posts a text message to a Telegram chat, group, or channel via the bot, addressed by chat_id (numeric id or @channelusername the bot can reach). Use to deliver notifications, replies, or alerts; supports Markdown/HTML formatting and inline keyboards. Not idempotent: each call sends a new message.', idempotent: false },
  displayName: 'Send Text Message',
  propertyGroups: [
    { key: 'send_to', display: 'section', label: 'Send to', icon: 'send', props: ['instructions', 'chat_id'] },
    { key: 'message', display: 'section', label: 'Message', icon: 'text', props: ['format', 'message', 'instructions_format'] },
  ],
  props: {
    instructions: telegramCommons.form.chatIdInstructions(),
    chat_id: telegramCommons.form.chatIdProp(),
    format: telegramCommons.form.parseModeProp(),
    message: Property.LongText({
      displayName: 'Message',
      description: 'Up to 4096 characters.',
      required: true,
    }),
    instructions_format: telegramCommons.form.formatLinkInstructions(),
    message_thread_id: telegramCommons.form.messageThreadIdProp(),
    web_page_preview: telegramCommons.form.linkPreviewProp(),
    disable_notification: telegramCommons.form.disableNotificationProp(),
    protect_content: telegramCommons.form.protectContentProp(),
    reply_to_message_id: telegramCommons.form.replyToMessageIdProp(),
    reply_markup: telegramCommons.form.replyMarkupProp(),
  },
  outputSchema: sendTextMessageActionOutputSchema,
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
