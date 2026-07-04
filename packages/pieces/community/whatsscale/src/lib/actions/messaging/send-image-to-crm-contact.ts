import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';
import { whatsscaleProps } from '../../common/props';
import { prepareFile } from '../../common/prepare-file';

export const sendImageToCrmContactAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_image_to_crm_contact',
  displayName: 'Send an Image to a CRM Contact',
  description: 'Send an image to a WhatsScale CRM contact selected from the dropdown.',
  audience: 'both',
  aiMetadata: { description: 'Sends an image to a contact stored in the WhatsScale CRM, identified by CRM contact ID chosen from the dropdown, with an optional caption. Pick this when the recipient is a managed CRM record; use the plain contact, group, manual-entry, or channel image variants for non-CRM recipients. Requires a directly downloadable image URL. Not idempotent: each call delivers another image.', idempotent: false },
  props: {
    session: whatsscaleProps.session,
    crmContact: whatsscaleProps.crmContact,
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
    const { session, crmContact, imageUrl, caption } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const preparedUrl = await prepareFile(apiKey, imageUrl);

    const response = await whatsscaleClient(apiKey, HttpMethod.POST, '/api/sendImage', {
      session,
      contact_type: 'crm_contact',
      crm_contact_id: crmContact,
      file: preparedUrl,
      caption: caption ?? '',
    });

    return response.body;
  },
});
