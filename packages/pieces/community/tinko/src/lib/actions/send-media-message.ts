import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { tinkoAuth } from '../auth';
import { TinkoItemResponse, TinkoSendMessageResult, tinkoClient } from '../common/client';
import { messageProps } from '../common/message';
import { tinkoOutput } from '../common/output';
import { tinkoProps } from '../common/props';

const CAPTION_TYPES = ['image', 'video', 'document'];

export const sendMediaMessageAction = createAction({
  auth: tinkoAuth,
  name: 'send_media_message',
  classification: 'WRITE',
  displayName: 'Send Media Message',
  description: 'Sends an image, video, audio, document or sticker from a public URL.',
  audience: 'both',
  aiMetadata: {
    description:
      'Send a file (image, video, audio, document or sticker) to a phone number, contact or WhatsApp group through a connected Tinko channel. The file must be reachable at a public URL. Use Send Text Message for plain text. Each call sends a new message, so retries duplicate it.',
    idempotent: false,
  },
  props: {
    channel: tinkoProps.channelDropdown({
      description: 'The channel (connected number or account) that sends the message.',
    }),
    recipient: messageProps.recipient(),
    type: Property.StaticDropdown({
      displayName: 'Media Type',
      description: 'The kind of file to send.',
      required: true,
      defaultValue: 'image',
      options: {
        options: [
          { label: 'Image', value: 'image' },
          { label: 'Video', value: 'video' },
          { label: 'Audio', value: 'audio' },
          { label: 'Document', value: 'document' },
          { label: 'Sticker', value: 'sticker' },
        ],
      },
    }),
    path: Property.ShortText({
      displayName: 'Media URL',
      description: 'Public URL of the file, for example https://example.com/invoice.pdf.',
      required: true,
    }),
    caption: Property.LongText({
      displayName: 'Caption',
      description:
        'Text shown together with the file, up to 1024 characters. Used only for images, videos and documents.',
      required: false,
    }),
    attendant: tinkoProps.attendantDropdown({
      description: 'The Tinko user registered as the sender of the message. Leave empty to send as the company.',
    }),
  },
  async run(context) {
    const { channel, recipient, type, path, caption, attendant } = context.propsValue;
    const response = await tinkoClient.request<TinkoItemResponse<TinkoSendMessageResult>>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/messages',
      body: messageProps.body({
        channel,
        recipient,
        attendant,
        fields: {
          type,
          path: path.trim(),
          caption: CAPTION_TYPES.includes(type) ? caption : undefined,
        },
      }),
    });
    return tinkoOutput.sentMessage(response.data ?? {});
  },
});
