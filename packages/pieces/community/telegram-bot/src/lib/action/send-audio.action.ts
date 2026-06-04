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

export const telegramSendAudioAction = createAction({
  auth: telegramBotAuth,
  name: 'send_audio',
  displayName: 'Send Audio',
  description: 'Send an audio file to a Telegram chat (.MP3/.M4A — shown in the music player)',
  props: {
    instructions: telegramCommons.chatIdInstructions(),
    chat_id: telegramCommons.chatIdProp(),
    message_thread_id: telegramCommons.messageThreadIdProp(),
    audio: Property.File({
      displayName: 'Audio',
      description: 'The audio file to send (.MP3 or .M4A).',
      required: false,
    }),
    audio_id: Property.ShortText({
      displayName: 'Audio Id',
      description: 'Reuse an audio file previously uploaded to Telegram by passing its file_id.',
      required: false,
    }),
    caption: Property.LongText({
      displayName: 'Caption',
      description: 'Optional caption (0–1024 chars).',
      required: false,
    }),
    format: telegramCommons.parseModeProp(),
    instructions_format: telegramCommons.formatLinkInstructions(),
    duration: Property.Number({
      displayName: 'Duration',
      description: 'Duration of the audio in seconds.',
      required: false,
    }),
    performer: Property.ShortText({
      displayName: 'Performer',
      description: 'Performer / artist name.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Track Title',
      description: 'Track title.',
      required: false,
    }),
    disable_notification: telegramCommons.disableNotificationProp(),
    protect_content: telegramCommons.protectContentProp(),
    reply_to_message_id: telegramCommons.replyToMessageIdProp(),
    reply_markup: telegramCommons.replyMarkupProp(),
  },
  async run(ctx) {
    const file = ctx.propsValue.audio as ApFile | undefined;
    const audioId = ctx.propsValue.audio_id;
    const parseMode = telegramCommons.resolveParseMode(ctx.propsValue.format);

    if (!file && !audioId) {
      throw new Error('Either an audio file or an audio id must be provided.');
    }

    const headers: Record<string, string> = {};
    let body: HttpMessageBody;

    if (file && file.data && file.filename) {
      const form = new FormData();
      form.append('audio', file.data, file.filename);
      form.append('chat_id', ctx.propsValue.chat_id);
      if (ctx.propsValue.caption) form.append('caption', ctx.propsValue.caption);
      if (ctx.propsValue.message_thread_id) {
        form.append('message_thread_id', ctx.propsValue.message_thread_id);
      }
      if (parseMode) form.append('parse_mode', parseMode);
      if (ctx.propsValue.duration) form.append('duration', String(ctx.propsValue.duration));
      if (ctx.propsValue.performer) form.append('performer', ctx.propsValue.performer);
      if (ctx.propsValue.title) form.append('title', ctx.propsValue.title);
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
        audio: audioId,
        caption: ctx.propsValue.caption ?? undefined,
        message_thread_id: ctx.propsValue.message_thread_id ?? undefined,
        parse_mode: parseMode,
        duration: ctx.propsValue.duration ?? undefined,
        performer: ctx.propsValue.performer ?? undefined,
        title: ctx.propsValue.title ?? undefined,
        disable_notification: ctx.propsValue.disable_notification ?? false,
        protect_content: ctx.propsValue.protect_content ?? false,
        reply_to_message_id: ctx.propsValue.reply_to_message_id ?? undefined,
        reply_markup: ctx.propsValue.reply_markup ?? undefined,
      };
    }

    return await httpClient.sendRequest<never>({
      method: HttpMethod.POST,
      url: telegramCommons.getApiUrl(ctx.auth, 'sendAudio'),
      headers,
      body,
    });
  },
});
