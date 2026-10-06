import {
  ApFile,
  createAction,
  MarkdownVariant,
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
import { sendAudioActionOutputSchema } from '../output-schemas';

export const telegramSendAudioAction = createAction({
  auth: telegramBotAuth,
  name: 'send_audio',
  classification: 'WRITE',
  displayName: 'Send Audio',
  description: "Send an MP3 or M4A file that plays in Telegram's music player.",
  audience: 'human',
  aiMetadata: { description: 'Sends an audio file (.MP3/.M4A) to a Telegram chat where it appears in the music player, supplied as a file or a previously uploaded file_id, with optional performer and track title. Use for music or audio tracks; for raw file attachments use Send Document. Not idempotent: each call sends a new message.', idempotent: false },
  propertyGroups: [
    { key: 'send_to', display: 'section', label: 'Send to', icon: 'send', props: ['instructions', 'chat_id'] },
    { key: 'file', display: 'section', label: 'Audio', icon: 'paperclip', props: ['file_info', 'audio', 'audio_id'] },
    { key: 'caption', display: 'section', label: 'Caption', icon: 'text', props: ['format', 'caption', 'instructions_format'] },
    { key: 'track', display: 'section', label: 'Track Details', icon: 'tag', props: ['title', 'performer', 'duration'] },
  ],
  props: {
    instructions: telegramCommons.form.chatIdInstructions(),
    chat_id: telegramCommons.form.chatIdProp(),
    file_info: Property.MarkDown({
      value: 'Upload a file or enter a file ID. If both are set, the upload is sent.',
      variant: MarkdownVariant.INFO,
    }),
    audio: Property.File({
      displayName: 'Audio',
      description: 'An MP3 or M4A file.',
      required: false,
    }),
    audio_id: Property.ShortText({
      displayName: 'Audio ID',
      description: 'file_id of audio already on Telegram, to send it again.',
      required: false,
    }),
    format: telegramCommons.form.parseModeProp(),
    caption: Property.LongText({
      displayName: 'Caption',
      description: 'Up to 1024 characters.',
      required: false,
    }),
    instructions_format: telegramCommons.form.formatLinkInstructions(),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Track name shown in the player.',
      required: false,
    }),
    performer: Property.ShortText({
      displayName: 'Performer',
      description: 'Artist name shown in the player.',
      required: false,
      width: 'half',
    }),
    duration: Property.Number({
      displayName: 'Duration',
      description: 'Length in seconds.',
      required: false,
      width: 'half',
    }),
    message_thread_id: telegramCommons.form.messageThreadIdProp(),
    disable_notification: telegramCommons.form.disableNotificationProp(),
    protect_content: telegramCommons.form.protectContentProp(),
    reply_to_message_id: telegramCommons.form.replyToMessageIdProp(),
    reply_markup: telegramCommons.form.replyMarkupProp(),
  },
  outputSchema: sendAudioActionOutputSchema,
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
