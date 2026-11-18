import { createAction, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { makeClient } from '../common';
import {
  businessAccountIdProp,
  freeFormWindowInfo,
  phoneNumberIdDropdown,
  recipientPhoneProp,
} from '../common/props';

export const sendImage = createAction({
  auth: kapsoAuth,
  name: 'send_image',
  classification: 'WRITE',
  displayName: 'Send Image',
  description: 'Send an image message via WhatsApp.',
  audience: 'both',
  aiMetadata: {
    description: 'Sends an image to a WhatsApp recipient, optionally with a caption. Supply the image either as a public URL or as the media ID of a previously uploaded file (use one or the other). Each call delivers a new message, so it is not idempotent.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'sender',
      display: 'section',
      label: 'Send From',
      icon: 'send',
      props: ['businessAccountId', 'phoneNumberId'],
    },
    {
      key: 'recipient',
      display: 'section',
      label: 'Send To',
      icon: 'user',
      props: ['windowInfo', 'to'],
    },
    {
      key: 'media',
      display: 'section',
      label: 'Image',
      icon: 'paperclip',
      props: ['imageUrl', 'imageId', 'caption'],
    },
  ],
  props: {
    businessAccountId: businessAccountIdProp,
    phoneNumberId: phoneNumberIdDropdown,
    windowInfo: freeFormWindowInfo,
    to: recipientPhoneProp,
    imageUrl: Property.ShortText({
      displayName: 'Image URL',
      description: 'A public link to the image. Leave empty to use a Media ID.',
      placeholder: 'https://example.com/photo.jpg',
      required: false,
    }),
    imageId: Property.ShortText({
      displayName: 'Media ID',
      description: 'ID of a file already uploaded to WhatsApp. Use instead of the URL.',
      required: false,
    }),
    caption: Property.LongText({
      displayName: 'Caption',
      description: 'Text shown under the image.',
      required: false,
    }),
  },
  async run(context) {
    const { phoneNumberId, to, imageUrl, imageId, caption } = context.propsValue;
    if (!imageUrl && !imageId) {
      throw new Error('Enter an Image URL or a Media ID.');
    }
    const client = makeClient(context.auth.secret_text);

    const response = await client.messages.sendImage({
      phoneNumberId,
      to,
      image: {
        link: imageUrl || undefined,
        id: imageId || undefined,
        caption: caption ?? undefined,
      },
    });

    return response;
  },
});
