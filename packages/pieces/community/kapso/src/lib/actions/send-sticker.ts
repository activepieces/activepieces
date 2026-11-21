import { createAction, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { makeClient } from '../common';
import {
  businessAccountIdProp,
  freeFormWindowInfo,
  phoneNumberIdDropdown,
  recipientPhoneProp,
} from '../common/props';

export const sendSticker = createAction({
  auth: kapsoAuth,
  name: 'send_sticker',
  classification: 'WRITE',
  displayName: 'Send Sticker',
  description: 'Send a sticker message via WhatsApp.',
  audience: 'both',
  aiMetadata: {
    description: 'Sends a WebP sticker to a WhatsApp recipient. Supply the sticker either as a public URL or as the media ID of a previously uploaded file (use one or the other). Each call delivers a new message, so it is not idempotent.',
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
      label: 'Sticker',
      icon: 'paperclip',
      props: ['stickerUrl', 'stickerId'],
    },
  ],
  props: {
    businessAccountId: businessAccountIdProp,
    phoneNumberId: phoneNumberIdDropdown,
    windowInfo: freeFormWindowInfo,
    to: recipientPhoneProp,
    stickerUrl: Property.ShortText({
      displayName: 'Sticker URL',
      description: 'A public link to the WebP sticker. Leave empty to use a Media ID.',
      placeholder: 'https://example.com/sticker.webp',
      required: false,
    }),
    stickerId: Property.ShortText({
      displayName: 'Media ID',
      description: 'ID of a file already uploaded to WhatsApp. Use instead of the URL.',
      required: false,
    }),
  },
  async run(context) {
    const { phoneNumberId, to, stickerUrl, stickerId } = context.propsValue;
    if (!stickerUrl && !stickerId) {
      throw new Error('Enter a Sticker URL or a Media ID.');
    }
    const client = makeClient(context.auth.secret_text);

    const response = await client.messages.sendSticker({
      phoneNumberId,
      to,
      sticker: {
        link: stickerUrl || undefined,
        id: stickerId || undefined,
      },
    });

    return response;
  },
});
