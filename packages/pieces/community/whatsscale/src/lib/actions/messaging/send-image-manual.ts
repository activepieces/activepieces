import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';
import { whatsscaleProps } from '../../common/props';
import { ChatType } from '../../common/types';
import { buildRecipientBody, RecipientType } from '../../common/recipients';
import { prepareFile } from '../../common/prepare-file';

export const sendImageManualAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_image_manual',
  displayName: 'Send an Image (Manual Entry)',
  description: 'Send an image by entering a phone number or group ID manually.',
  audience: 'both',
  aiMetadata: { description: 'Sends an image to a recipient typed in directly rather than picked from a list, with an optional caption. Set the chat type to Contact (then a phone number with country code) or Group (then a bare group ID). Pick this when you already hold the raw number/ID; use the contact, group, CRM-contact, or channel image variants when selecting from session lists. Requires a directly downloadable image URL. Not idempotent: each call delivers another image.', idempotent: false },
  props: {
    session: whatsscaleProps.session,
    chatType: Property.StaticDropdown({
      displayName: 'Chat Type',
      description: 'Select whether you are sending to a contact or a group.',
      required: true,
      options: {
        options: [
          { label: 'Contact', value: ChatType.CONTACT },
          { label: 'Group', value: ChatType.GROUP },
        ],
      },
    }),
    recipient: Property.ShortText({
      displayName: 'Phone Number / Group ID',
      description: 'Phone number with country code (digits only) or group ID (without suffix).',
      required: true,
    }),
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
    const { session, chatType, recipient, imageUrl, caption } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const preparedUrl = await prepareFile(apiKey, imageUrl);

    const recipientBody = buildRecipientBody(
      RecipientType.MANUAL,
      session,
      recipient,
      chatType as ChatType,
    );

    const response = await whatsscaleClient(apiKey, HttpMethod.POST, '/api/sendImage', {
      ...recipientBody,
      file: preparedUrl,
      caption: caption ?? '',
    });

    return response.body;
  },
});
