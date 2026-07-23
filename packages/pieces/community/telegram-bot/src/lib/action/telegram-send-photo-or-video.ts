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

export const telegramSendPhotoOrVideo = createAction({
  auth: telegramBotAuth,
  name: 'telegram_send_photo_or_video',
  displayName: 'Send Photo, Video, Sticker or GIF',
  description:
    'Send a single photo, video, sticker, or animated GIF to a Telegram chat.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sends a single photo, video, sticker, or animated GIF to a chat (chat_id is a numeric id or @channelusername the bot can reach), supplied as an uploaded file OR a previously uploaded Telegram file_id, with an optional caption. Pick the media_type, then provide either the file or its file_id for that type. Use for one inline media item; for several in one album use telegram_send_media_group, for an arbitrary attachment use telegram_send_document. Caption format defaults to plain text. Not idempotent: each call posts a new message.',
    idempotent: false,
  },
  props: {
    chat_id: telegramCommons.chatIdProp(),
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
                "The image file_id previously uploaded to Telegram's servers",
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
                "The video file_id previously uploaded to Telegram's servers",
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
                "The sticker file_id previously uploaded to Telegram's servers",
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
                "The GIF or MPEG-4 without sound file_id previously uploaded to Telegram's servers",
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
    format: Property.StaticDropdown({
      displayName: 'Caption Format',
      description:
        'How the caption should be parsed by Telegram. Defaults to plain text; only set MarkdownV2 or HTML when the caption is correctly escaped/tagged.',
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
    message: Property.LongText({
      displayName: 'Caption',
      description: 'The caption to send with the media',
      required: false,
    }),
    message_thread_id: Property.ShortText({
      displayName: 'Message Thread Id',
      description:
        'Unique identifier for the target message thread of the forum; supergroup forums only.',
      required: false,
    }),
    disable_notification: telegramCommons.disableNotificationProp(),
    protect_content: telegramCommons.protectContentProp(),
    reply_markup: Property.Json({
      displayName: 'Reply Markup',
      description:
        'Advanced/optional. A raw JSON-serialized inline keyboard, e.g. {"inline_keyboard":[[{"text":"Open","url":"https://example.com"}]]}. Malformed markup is rejected by Telegram.',
      required: false,
    }),
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
        form.append(
          'reply_markup',
          JSON.stringify(ctx.propsValue['reply_markup'])
        );
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
