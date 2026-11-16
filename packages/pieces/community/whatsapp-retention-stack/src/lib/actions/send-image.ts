import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retentionStackAuth } from '../..';
import { apiRequest, commonProps } from '../common';

export const sendImage = createAction({
  name: 'sendImage',
  auth: retentionStackAuth,
  displayName: 'Send Image',
  description: 'Sends an image from a public URL, with an optional caption.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description: 'Sends an image, fetched from a public URL, from the linked WhatsApp number to one phone number or group. Not idempotent: each call sends a new message.',
    idempotent: false,
  },
  props: {
    ...commonProps,
    imageUrl: Property.ShortText({ displayName: 'Image URL', description: 'Public URL of the image.', required: true }),
    caption: Property.LongText({ displayName: 'Caption', required: false }),
  },
  async run(ctx) {
    const { session, chatId, imageUrl, caption } = ctx.propsValue;
    return await apiRequest(ctx.auth.secret_text, HttpMethod.POST, '/v1/sendImage', {
      session,
      chatId,
      file: { url: imageUrl },
      caption,
    });
  },
});
