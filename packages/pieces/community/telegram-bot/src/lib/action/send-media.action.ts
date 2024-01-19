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
export const telegramSendMediaAction = createAction({
  auth: telegramBotAuth,
  name: 'send_media',
  description: 'Send a media message through a Telegram bot',
  displayName: 'Send Media',
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
    media_type: Property.StaticDropdown({
      displayName: 'Media Type',
      required: false,
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
            photoUrl: Property.ShortText({
              displayName: 'Image Url',
              description: 'The image url to be downloaded by Telegram',
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
            videoUrl: Property.ShortText({
              displayName: 'Video Url',
              description: 'The video url to be downloaded by Telegram',
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
            stickerUrl: Property.ShortText({
              displayName: 'Sticker Url',
              description:
                'The static sticker url to be downloaded by Telegram (supports only .WEBP files)',
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
            animationUrl: Property.ShortText({
              displayName: 'GIF Url',
              description:
                'The GIF or MPEG-4 without sound url to be downloaded by Telegram',
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
        return propsBuilders[media_type as unknown as string]();
      },
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
    const mediaType = ctx.propsValue['media_type'];
    const headers: Record<string, string> = {};
    const queryParams: QueryParams = {};
    let body: HttpMessageBody | undefined = undefined;
    let method = 'sendMessage';
    if (typeof mediaType !== 'undefined') {
      // send media message
      const [file, url, id] = [
        ctx.propsValue.media?.[mediaType] as ApFile,
        ctx.propsValue.media?.[mediaType + 'Url'] as string,
        ctx.propsValue.media?.[mediaType + 'Id'] as string,
      ];

      const methods: Partial<Record<string, string>> = {
        photo: 'sendPhoto',
        video: 'sendVideo',
        sticker: 'sendSticker',
        animation: 'sendAnimation',
      };

      const mediaMethod = methods[mediaType];

      if (!mediaMethod) {
        throw new Error('Unknown media type method (' + mediaType + ')');
      }
      method = mediaMethod;

      if (typeof file !== 'undefined') {
        // upload
        headers['Content-Type'] = 'multipart/form-data';
        const form = new FormData();
        form.append('file', file.data, file.extension);
        body = form;
        queryParams.chat_id = ctx.propsValue['chat_id'];
        queryParams.caption = ctx.propsValue['message'];
        if (ctx.propsValue['message_thread_id'])
          queryParams.message_thread_id = ctx.propsValue['message_thread_id'];
        queryParams.parse_mode = ctx.propsValue['format'] ?? 'MarkdownV2';

        // TODO: research how to
        // if (ctx.propsValue['reply_markup'])
        //   queryParams.reply_markup = ctx.propsValue['reply_markup'];
      } else if (typeof url !== 'undefined' || typeof id !== 'undefined') {
        // download
        body = body || {};
        body[mediaType] = url ?? id;
        body.chat_id = ctx.propsValue['chat_id'];
        body.caption = ctx.propsValue['message'];
        body.message_thread_id =
          ctx.propsValue['message_thread_id'] ?? undefined;
        body.parse_mode = ctx.propsValue['format'] ?? 'MarkdownV2';
        body.reply_markup = ctx.propsValue['reply_markup'] ?? undefined;
      } else {
        throw new Error(
          'No media defined. Ensure you have setup file, url or id'
        );
      }
    }

    if (typeof body === 'undefined') {
      throw new Error('No body defined');
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
