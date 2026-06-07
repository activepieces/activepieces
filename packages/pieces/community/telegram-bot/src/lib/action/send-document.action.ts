import {
  ApFile,
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import {
  HttpMessageBody,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import FormData from 'form-data';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

export const telegramSendDocumentAction = createAction({
  auth: telegramBotAuth,
  name: 'send_document',
  displayName: 'Send Document',
  description: 'Send a generic file (document) to a Telegram chat',
  props: {
    instructions: telegramCommons.chatIdInstructions(),
    chat_id: telegramCommons.chatIdProp(),
    message_thread_id: telegramCommons.messageThreadIdProp(),
    document: Property.File({
      displayName: 'Document',
      description: 'The document file to send. Telegram supports any file up to 50 MB.',
      required: false,
    }),
    document_id: Property.ShortText({
      displayName: 'Document Id',
      description:
        'Reuse a document previously uploaded to Telegram by passing its file_id. Either provide a document or a document id.',
      required: false,
    }),
    caption: Property.LongText({
      displayName: 'Caption',
      description: 'Optional caption to display below the document (0–1024 chars).',
      required: false,
    }),
    format: telegramCommons.parseModeProp(),
    instructions_format: telegramCommons.formatLinkInstructions(),
    disable_notification: telegramCommons.disableNotificationProp(),
    protect_content: telegramCommons.protectContentProp(),
    reply_to_message_id: telegramCommons.replyToMessageIdProp(),
    reply_markup: telegramCommons.replyMarkupProp(),
  },
  async run(ctx) {
    const file = ctx.propsValue.document as ApFile | undefined;
    const documentId = ctx.propsValue.document_id;
    const parseMode = telegramCommons.resolveParseMode(ctx.propsValue.format);

    if (!file && !documentId) {
      throw new Error(
        'Either a document file or a document id must be provided.'
      );
    }

    const headers: Record<string, string> = {};
    let body: HttpMessageBody;

    if (file && file.data && file.filename) {
      const form = new FormData();
      form.append('document', file.data, file.filename);
      form.append('chat_id', ctx.propsValue.chat_id);
      if (ctx.propsValue.caption) form.append('caption', ctx.propsValue.caption);
      if (ctx.propsValue.message_thread_id) {
        form.append('message_thread_id', ctx.propsValue.message_thread_id);
      }
      if (parseMode) form.append('parse_mode', parseMode);
      if (ctx.propsValue.disable_notification) form.append('disable_notification', 'true');
      if (ctx.propsValue.protect_content) form.append('protect_content', 'true');
      if (ctx.propsValue.reply_to_message_id) {
        form.append('reply_to_message_id', String(ctx.propsValue.reply_to_message_id));
      }
      if (ctx.propsValue.reply_markup) {
        form.append('reply_markup', JSON.stringify(ctx.propsValue.reply_markup));
      }
      body = form;
      Object.assign(headers, form.getHeaders());
    } else {
      body = {
        chat_id: ctx.propsValue.chat_id,
        document: documentId,
        caption: ctx.propsValue.caption ?? undefined,
        message_thread_id: ctx.propsValue.message_thread_id ?? undefined,
        parse_mode: parseMode,
        disable_notification: ctx.propsValue.disable_notification ?? false,
        protect_content: ctx.propsValue.protect_content ?? false,
        reply_to_message_id: ctx.propsValue.reply_to_message_id ?? undefined,
        reply_markup: ctx.propsValue.reply_markup ?? undefined,
      };
    }

    return await httpClient.sendRequest<never>({
      method: HttpMethod.POST,
      url: telegramCommons.getApiUrl(ctx.auth, 'sendDocument'),
      headers,
      body,
    });
  },
});
