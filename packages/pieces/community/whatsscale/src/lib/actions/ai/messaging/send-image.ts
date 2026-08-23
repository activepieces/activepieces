import { createAction, Property } from '@activepieces/pieces-framework';
import { sendMessageResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { ConductorSendMessageResult, flattenSendMessageResult } from '../../../common/messaging';
import { whatsscaleProps } from '../../../common/props';
import { ChatType } from '../../../common/types';
import { buildRecipientBody, RecipientType } from '../../../common/recipients';
import { prepareFile } from '../../../common/prepare-file';

export const sendImageManualAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_image_manual',
  classification: 'WRITE',
  displayName: 'Send an Image (By ID)',
  description: 'Send an image to a contact, group, channel, or CRM contact by ID rather than picking from a list.',
  audience: 'ai',
  aiMetadata: { description: 'Sends an image to a recipient identified directly by ID rather than a builder dropdown, with an optional caption. Set recipient_type to contact (phone number with country code), group or channel (bare ID, no @ suffix needed), or crm_contact (WhatsScale CRM contact ID). Requires a directly downloadable image URL. Not idempotent: each call delivers another image.', idempotent: false },
  outputSchema: sendMessageResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    chatType: Property.StaticDropdown({
      displayName: 'Recipient Type',
      description: 'Who this image is being sent to.',
      required: true,
      options: {
        options: [
          { label: 'Contact (Phone Number)', value: ChatType.CONTACT },
          { label: 'Group', value: ChatType.GROUP },
          { label: 'Channel', value: ChatType.CHANNEL },
          { label: 'CRM Contact', value: ChatType.CRM_CONTACT },
        ],
      },
    }),
    recipient: Property.ShortText({
      displayName: 'Recipient ID',
      description:
        'Contact: phone number with country code. Group/Channel: the bare ID, no @ suffix needed. CRM Contact: the CRM contact ID.',
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

    return flattenSendMessageResult(response.body as ConductorSendMessageResult);
  },
});
