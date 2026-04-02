import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';
import { whatsscaleProps } from '../../common/props';
import { prepareFile } from '../../common/prepare-file';

export const sendImageToGroupAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_image_to_group',
  displayName: 'Send an Image to a Group',
  description: 'Send an image to a WhatsApp group selected from the dropdown.',
  props: {
    session: whatsscaleProps.session,
    group: whatsscaleProps.group,
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
    const { session, group, imageUrl, caption } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const preparedUrl = await prepareFile(apiKey, imageUrl);

    const response = await whatsscaleClient(apiKey, HttpMethod.POST, '/api/sendImage', {
      session,
      chatId: group,
      file: preparedUrl,
      caption: caption ?? '',
      platform: 'activepieces',
    });

    return response.body;
  },
});
