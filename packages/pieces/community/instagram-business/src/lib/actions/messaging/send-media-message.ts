import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';

import { sendMessageOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown } from '../../common';

export const sendMediaMessage = createAction({
  auth: instagramCommon.authentication,
  outputSchema: sendMessageOutputSchema,
  name: 'send_media_message',
  classification: 'WRITE',
  displayName: 'Send Media Message',
  description: 'Send an image, video or audio file as a direct message.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends an image, video or audio file as an Instagram direct message, given a publicly reachable URL and the recipient Instagram-scoped user id. The same 24 hour reply window applies as for a text message. Not idempotent, since each call sends another message.',
    idempotent: false,
  },
  propertyGroups: [
    { key: 'account', display: 'section', label: 'Account', icon: 'user', props: ['page'] },
    { key: 'recipient', display: 'section', label: 'Send to', icon: 'send', props: ['window_info', 'recipient_id'] },
    { key: 'file', display: 'section', label: 'Attachment', icon: 'paperclip', props: ['media_type', 'url'] },
  ],
  props: {
    page: instagramCommon.page,
    window_info: Property.MarkDown({
      value: 'Instagram only delivers to people who messaged you in the last 24 hours.',
      variant: MarkdownVariant.INFO,
    }),
    recipient_id: Property.ShortText({
      displayName: 'Recipient ID',
      description: 'Their Instagram-scoped id, from List Conversations or List Messages.',
      required: true,
    }),
    media_type: Property.StaticDropdown({
      displayName: 'Media Type',
      required: true,
      display: 'cards',
      defaultValue: 'image',
      options: {
        options: [
          { label: 'Image', value: 'image' },
          { label: 'Video', value: 'video' },
          { label: 'Audio', value: 'audio' },
        ],
      },
    }),
    url: Property.ShortText({
      displayName: 'Media URL',
      description: 'Public link to the file, from a plain static host.',
      placeholder: 'https://example.com/photo.jpg',
      required: true,
    }),
  },
  async run({ propsValue }) {
    const page: FacebookPageDropdown = propsValue.page;
    const pageId = instagramCommon.requirePageId(page);

    const result = await instagramCommon.graphRequest<{
      recipient_id?: string;
      message_id?: string;
    }>({
      method: HttpMethod.POST,
      resourceUri: `/${pageId}/messages`,
      accessToken: page.accessToken,
      body: {
        recipient: { id: propsValue.recipient_id },
        message: {
          attachment: {
            type: propsValue.media_type,
            payload: { url: propsValue.url },
          },
        },
      },
    });

    return {
      message_id: result.message_id,
      recipient_id: result.recipient_id ?? propsValue.recipient_id,
    };
  },
});
