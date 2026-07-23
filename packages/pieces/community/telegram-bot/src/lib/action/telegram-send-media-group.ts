import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

const MEDIA_GROUP_LIMIT = 10;

type MediaItem = {
  type: 'photo' | 'video' | 'audio' | 'document';
  media: string;
  caption?: string;
  parse_mode?: string;
};

export const telegramSendMediaGroup = createAction({
  auth: telegramBotAuth,
  name: 'telegram_send_media_group',
  displayName: 'Send Media Group (Album)',
  description:
    'Send a group of 2–10 photos, videos, documents or audios as an album to a chat.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sends 2–10 media items (each a public URL or a Telegram file_id) as one grouped album to a chat addressed by chat_id (a numeric id or @channelusername the bot can reach). Use to post several photos/videos together; photo and video may be mixed, but audio-only and document-only groups cannot be combined with other types. Item captions default to plain text. For a single item use telegram_send_photo_or_video. Not idempotent: each call posts a new album.',
    idempotent: false,
  },
  props: {
    chat_id: telegramCommons.chatIdProp(),
    media: Property.Array({
      displayName: 'Media',
      description:
        'Media items to send. Each must be a URL or a Telegram file_id. Mixing photo/video is allowed; audio and document groups cannot be mixed with other types.',
      required: true,
      properties: {
        type: Property.StaticDropdown({
          displayName: 'Type',
          required: true,
          options: {
            options: [
              { label: 'Photo', value: 'photo' },
              { label: 'Video', value: 'video' },
              { label: 'Audio', value: 'audio' },
              { label: 'Document', value: 'document' },
            ],
          },
          defaultValue: 'photo',
        }),
        media: Property.ShortText({
          displayName: 'Media URL or File Id',
          description:
            'Public URL or a Telegram file_id of an already uploaded media item.',
          required: true,
        }),
        caption: Property.LongText({
          displayName: 'Caption',
          required: false,
        }),
      },
    }),
    parse_mode: Property.StaticDropdown({
      displayName: 'Caption Format',
      description:
        'How item captions should be parsed by Telegram. Defaults to plain text; only set MarkdownV2 or HTML when captions are correctly escaped/tagged.',
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
    disable_notification: telegramCommons.disableNotificationProp(),
    protect_content: telegramCommons.protectContentProp(),
    reply_to_message_id: telegramCommons.replyToMessageIdProp(),
  },
  async run(ctx) {
    const items = (ctx.propsValue.media ?? []) as Array<Record<string, unknown>>;
    if (items.length < 2 || items.length > MEDIA_GROUP_LIMIT) {
      throw new Error('A media group must contain 2–10 media items.');
    }
    const parseMode = telegramCommons.resolveParseMode(ctx.propsValue.parse_mode);

    const media: MediaItem[] = items.map((item) => {
      const type = String(item['type'] ?? 'photo') as MediaItem['type'];
      const value = String(item['media'] ?? '');
      if (!value) {
        throw new Error('Each media item must define a URL or file_id.');
      }
      const caption = item['caption'] ? String(item['caption']) : undefined;
      const mediaItem: MediaItem = { type, media: value };
      if (caption) mediaItem.caption = caption;
      if (caption && parseMode) mediaItem.parse_mode = parseMode;
      return mediaItem;
    });

    return await httpClient.sendRequest<never>({
      method: HttpMethod.POST,
      url: telegramCommons.getApiUrl(ctx.auth, 'sendMediaGroup'),
      body: {
        chat_id: ctx.propsValue.chat_id,
        message_thread_id: ctx.propsValue.message_thread_id ?? undefined,
        media,
        disable_notification: ctx.propsValue.disable_notification ?? false,
        protect_content: ctx.propsValue.protect_content ?? false,
        reply_to_message_id: ctx.propsValue.reply_to_message_id ?? undefined,
      },
    });
  },
});
