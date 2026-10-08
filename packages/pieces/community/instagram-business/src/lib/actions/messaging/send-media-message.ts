import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

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
  props: {
    page: instagramCommon.page,
    recipient_id: Property.ShortText({
      displayName: 'Recipient ID',
      required: true,
    }),
    media_type: Property.StaticDropdown({
      displayName: 'Media Type',
      required: true,
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
      description: 'Publicly reachable URL of the file. Instagram fetches it server side and rejects some hosts with an upload error, so prefer a plain static file URL.',
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
