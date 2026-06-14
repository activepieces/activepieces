import { createAction, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { makeClient } from '../common';
import { businessAccountIdProp, phoneNumberIdDropdown } from '../common/props';

export const sendSticker = createAction({
  auth: kapsoAuth,
  name: 'send_sticker',
  displayName: 'Send Sticker',
  description: 'Send a sticker message via WhatsApp.',
  audience: 'both',
  aiMetadata: {
    description: 'Sends a WebP sticker to a WhatsApp recipient. Supply the sticker either as a public URL or as the media ID of a previously uploaded file (use one or the other). Each call delivers a new message, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    businessAccountId: businessAccountIdProp,
    phoneNumberId: phoneNumberIdDropdown,
    to: Property.ShortText({
      displayName: 'Recipient Phone Number',
      description:
        'The recipient\'s phone number in international format (e.g. 15551234567).',
      required: true,
    }),
    stickerUrl: Property.ShortText({
      displayName: 'Sticker URL',
      description: 'Public URL of the sticker (WebP format).',
      required: false,
    }),
    stickerId: Property.ShortText({
      displayName: 'Sticker Media ID',
      description: 'Media ID of a previously uploaded sticker. Use either URL or Media ID.',
      required: false,
    }),
  },
  async run(context) {
    const { phoneNumberId, to, stickerUrl, stickerId } = context.propsValue;
    const client = makeClient(context.auth.secret_text);

    const response = await client.messages.sendSticker({
      phoneNumberId,
      to,
      sticker: {
        link: stickerUrl ?? undefined,
        id: stickerId ?? undefined,
      },
    });

    return response;
  },
});
