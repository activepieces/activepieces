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

export const telegramSendMediaGroupAction = createAction({
  auth: telegramBotAuth,
  name: 'send_media_group',
  displayName: 'Send Media Group',
  description:
    'Send a group of 2–10 photos, videos, documents or audios as an album to a chat',
  props: {
    instructions: telegramCommons.chatIdInstructions(),
    chat_id: telegramCommons.chatIdProp(),
    message_thread_id: telegramCommons.messageThreadIdProp(),
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
    parse_mode: telegramCommons.parseModeProp(),
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
