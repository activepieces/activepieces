import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';
import { whatsscaleProps } from '../../common/props';
import { prepareFile } from '../../common/prepare-file';

export const sendImageToContactAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_image_to_contact',
  displayName: 'Send an Image to a Contact',
  description: 'Send an image to a WhatsApp contact selected from the dropdown.',
  props: {
    session: whatsscaleProps.session,
    contact: whatsscaleProps.contact,
    imageUrl: Property.ShortText({
      displayName: 'Image URL',
      description: 'Direct URL to the image file.',
      required: true,
    }),
    caption: Property.ShortText({
      displayName: 'Caption',
      description: 'Optional caption for the image (max 1024 characters).',
      required: false,
    }),
  },
  async run(context) {
    const { session, contact, imageUrl, caption } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const preparedUrl = await prepareFile(apiKey, imageUrl);

    const response = await whatsscaleClient(apiKey, HttpMethod.POST, '/api/sendImage', {
      session,
      chatId: contact,
      file: preparedUrl,
      caption: caption ?? '',
    });

    return response.body;
  },
});
