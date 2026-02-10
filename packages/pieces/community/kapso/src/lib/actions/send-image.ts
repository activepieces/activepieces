import { createAction, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { makeClient } from '../common';
import { phoneNumberIdDropdown } from '../common/props';

export const sendImage = createAction({
  auth: kapsoAuth,
  name: 'send_image',
  displayName: 'Send Image',
  description: 'Send an image message via WhatsApp.',
  props: {
    phoneNumberId: phoneNumberIdDropdown,
    to: Property.ShortText({
      displayName: 'Recipient Phone Number',
      description:
        'The recipient\'s phone number in international format (e.g. 15551234567).',
      required: true,
    }),
    imageUrl: Property.ShortText({
      displayName: 'Image URL',
      description: 'Public URL of the image to send.',
      required: false,
    }),
    imageId: Property.ShortText({
      displayName: 'Image Media ID',
      description: 'Media ID of a previously uploaded image. Use either URL or Media ID.',
      required: false,
    }),
    caption: Property.LongText({
      displayName: 'Caption',
      description: 'Optional caption for the image.',
      required: false,
    }),
  },
  async run(context) {
    const { phoneNumberId, to, imageUrl, imageId, caption } = context.propsValue;
    const client = makeClient(context.auth.secret_text);

    const response = await client.messages.sendImage({
      phoneNumberId,
      to,
      image: {
        link: imageUrl ?? undefined,
        id: imageId ?? undefined,
        caption: caption ?? undefined,
      },
    });

    return response;
  },
});
