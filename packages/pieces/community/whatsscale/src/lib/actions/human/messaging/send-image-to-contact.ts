import { createAction, Property } from '@activepieces/pieces-framework';
import { sendMessageResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { resolveSendResult } from '../../../common/messaging';
import { whatsscaleProps } from '../../../common/props';
import { prepareMediaFile } from '../../../common/prepare-file';

export const sendImageToContactAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_image_to_contact',
  classification: 'WRITE',
  displayName: 'Send an Image to a Contact',
  description: 'Send an image to a WhatsApp contact selected from the dropdown.',
  audience: 'human',
  aiMetadata: { description: 'Sends an image to a WhatsApp contact whose chat ID is chosen from the session contact list, with an optional caption. Pick this when the recipient is a known direct contact; use the manual-entry image action for a raw phone number, or the group/CRM/channel variants for other recipient types. Takes either a directly downloadable image URL or a file from a previous step. Not idempotent: each call delivers another image.', idempotent: false },
  outputSchema: sendMessageResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    contact: whatsscaleProps.contact,
    imageUrl: Property.File({
      displayName: 'Image',
      description: 'A direct URL to the image, or a file from a previous step.',
      required: true,
    }),
    caption: Property.ShortText({
      displayName: 'Caption',
      description: 'Optional caption for the image (max 1024 characters).',
      required: false,
    }),
  },
  propertyGroups: [
    { key: 'destination', display: 'section' as const, label: 'Destination', props: ['session', 'contact'] },
    { key: 'content', display: 'section' as const, label: 'Image', props: ['imageUrl', 'caption'] },
  ],
  async run(context) {
    const { session, contact, imageUrl, caption } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const preparedUrl = await prepareMediaFile({ apiKey, file: imageUrl, files: context.files, mediaType: 'image' });

    const response = await whatsscaleClient(apiKey, HttpMethod.POST, '/api/sendImage', {
      session,
      chatId: contact,
      file: preparedUrl,
      caption: caption ?? '',
    });

    return await resolveSendResult({ apiKey: apiKey, body: response.body });
  },
});
