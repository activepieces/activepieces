import { createAction, Property } from '@activepieces/pieces-framework';
import { sendMessageResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { resolveSendResult } from '../../../common/messaging';
import { whatsscaleProps } from '../../../common/props';
import { prepareMediaFile } from '../../../common/prepare-file';

export const sendImageToCrmContactAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_image_to_crm_contact',
  classification: 'WRITE',
  displayName: 'Send an Image to a CRM Contact',
  description: 'Send an image to a WhatsScale CRM contact selected from the dropdown.',
  audience: 'human',
  aiMetadata: { description: 'Sends an image to a contact stored in the WhatsScale CRM, identified by CRM contact ID chosen from the dropdown, with an optional caption. Pick this when the recipient is a managed CRM record; use the plain contact, group, manual-entry, or channel image variants for non-CRM recipients. Takes either a directly downloadable image URL or a file from a previous step. Not idempotent: each call delivers another image.', idempotent: false },
  outputSchema: sendMessageResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    crmContact: whatsscaleProps.crmContact,
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
    { key: 'destination', display: 'section' as const, label: 'Destination', props: ['session', 'crmContact'] },
    { key: 'content', display: 'section' as const, label: 'Image', props: ['imageUrl', 'caption'] },
  ],
  async run(context) {
    const { session, crmContact, imageUrl, caption } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const preparedUrl = await prepareMediaFile({ apiKey, file: imageUrl, files: context.files, mediaType: 'image' });

    const response = await whatsscaleClient(apiKey, HttpMethod.POST, '/api/sendImage', {
      session,
      contact_type: 'crm_contact',
      crm_contact_id: crmContact,
      file: preparedUrl,
      caption: caption ?? '',
    });

    return await resolveSendResult({ apiKey: apiKey, body: response.body });
  },
});
