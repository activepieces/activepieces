import {
  ApFile,
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import {
  HttpMessageBody,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';
import FormData from 'form-data';

export const telegramSendMediaAction = createAction({
  auth: telegramBotAuth,
  name: 'send_media',
  description: 'Send a media message (photo, video, sticker, GIF) through a Telegram bot',
  audience: 'both',
  aiMetadata: { description: 'Sends a single photo, video, sticker, or animated GIF to a Telegram chat, supplied either as an uploaded file or a previously uploaded Telegram file_id. Use when delivering one rich-media item with an optional caption; for multiple items in one album use Send Media Group. Not idempotent: each call posts a new message.', idempotent: false },
  displayName: 'Send Media',
  props: {
    instructions: telegramCommons.chatIdInstructions(),
    chat_id: telegramCommons.chatIdProp(),
    message_thread_id: telegramCommons.messageThreadIdProp(),
    media_type: Property.StaticDropdown({
      displayName: 'Media Type',
      required: true,
      options: {
        disabled: false,
        placeholder: 'Select media type',
        options: [
          { label: 'Image', value: 'photo' },
          { label: 'Video', value: 'video' },
          { label: 'Sticker', value: 'sticker' },
          { label: 'GIF', value: 'animation' },
        ],
      },
    }),
    media: Property.DynamicProperties({
      auth: telegramBotAuth,
      displayName: 'Media Properties',
      required: false,
      refreshers: ['media_type'],
      async props({ media_type }) {
        const propsBuilders: Record<string, () => DynamicPropsValue> = {
          photo: () => ({
            photo: Property.File({
              displayName: 'Image',
              description: 'The image to be uploaded as a file',
              required: false,
            }),
            photoId: Property.ShortText({
              displayName: 'Image Id',
              description:
                "The image id previously uploaded to Telegram's servers",
              required: false,
            }),
          }),
          video: () => ({
            video: Property.File({
              displayName: 'Video',
              description: 'The video to be uploaded as a file',
              required: false,
            }),
            videoId: Property.ShortText({
              displayName: 'Video Id',
              description:
                "The video id previously uploaded to Telegram's servers",
              required: false,
            }),
          }),
          sticker: () => ({
            sticker: Property.File({
              displayName: 'Sticker',
              description:
                'The sticker to be uploaded as a file (supports .WEBP files for static and .TGS for animated)',
              required: false,
            }),
            emoji: Property.ShortText({
              displayName: 'Emoji',
              description:
                'Emoji associated with the sticker. Only for just uploaded stickers',
              required: false,
            }),
            stickerId: Property.ShortText({
              displayName: 'Sticker Id',
              description:
                "The sticker id previously uploaded to Telegram's servers",
              required: false,
            }),
          }),
          animation: () => ({
            animation: Property.File({
              displayName: 'GIF',
              description:
                'The GIF or MPEG-4 without sound file to be uploaded as a auto-playing animation',
              required: false,
            }),
            animationId: Property.ShortText({
              displayName: 'GIF Id',
              description:
                "The GIF or MPEG-4 without sound id previously uploaded to Telegram's servers",
              required: false,
            }),
            duration: Property.Number({
              displayName: 'Duration',
              description: 'Duration of sent video in seconds',
              required: false,
            }),
          }),
        };
        const builder = propsBuilders[media_type as unknown as string];
        if (!builder) {
          return {};
        }
        return builder();
      },
    }),
    format: telegramCommons.parseModeProp(),
    instructions_format: telegramCommons.formatLinkInstructions(),
    message: Property.LongText({
      displayName: 'Caption',
      description: 'The caption to send with the media',
      required: false,
    }),
    disable_notification: telegramCommons.disableNotificationProp(),
    protect_content: telegramCommons.protectContentProp(),
    reply_markup: telegramCommons.replyMarkupProp(),
  },
  async run(ctx) {
    const mediaType = ctx.propsValue['media_type'];
    if (!mediaType) {
      throw new Error('media_type is required');
    }

    const methods: Partial<Record<string, string>> = {
      photo: 'sendPhoto',
      video: 'sendVideo',
      sticker: 'sendSticker',
      animation: 'sendAnimation',
    };

    const method = methods[mediaType];
    if (!method) {
      throw new Error('Unknown media type method (' + mediaType + ')');
    }

    const headers: Record<string, string> = {};
    const queryParams: QueryParams = {};
    let body: HttpMessageBody | undefined = undefined;

    const file = ctx.propsValue.media?.[mediaType] as ApFile | undefined;
    const id = ctx.propsValue.media?.[mediaType + 'Id'] as string | undefined;
    const parseMode = telegramCommons.resolveParseMode(ctx.propsValue['format']);

    if (file && file.data && file.filename) {
      const form = new FormData();
      form.append(mediaType, file.data, file.filename);
      form.append('chat_id', ctx.propsValue['chat_id']);
      if (ctx.propsValue['message']) {
        form.append('caption', ctx.propsValue['message']);
      }
      if (ctx.propsValue['message_thread_id']) {
        form.append('message_thread_id', ctx.propsValue['message_thread_id']);
      }
      if (parseMode) {
        form.append('parse_mode', parseMode);
      }
      if (ctx.propsValue['disable_notification']) {
        form.append('disable_notification', 'true');
      }
      if (ctx.propsValue['protect_content']) {
        form.append('protect_content', 'true');
      }
      if (ctx.propsValue['reply_markup']) {
        form.append('reply_markup', JSON.stringify(ctx.propsValue['reply_markup']));
      }

      body = form;
      Object.assign(headers, form.getHeaders());
    } else if (typeof id !== 'undefined' && id !== '') {
      body = {
        [mediaType]: id,
        chat_id: ctx.propsValue['chat_id'],
        caption: ctx.propsValue['message'] ?? undefined,
        message_thread_id: ctx.propsValue['message_thread_id'] ?? undefined,
        parse_mode: parseMode,
        disable_notification: ctx.propsValue['disable_notification'] ?? false,
        protect_content: ctx.propsValue['protect_content'] ?? false,
        reply_markup: ctx.propsValue['reply_markup'] ?? undefined,
      };
    } else {
      throw new Error('No media defined. Provide either a file or an id.');
    }

    return await httpClient.sendRequest<never>({
      method: HttpMethod.POST,
      url: telegramCommons.getApiUrl(ctx.auth, method),
      headers,
      body,
      queryParams,
    });
  },
});
