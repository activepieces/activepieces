import { createAction, Property } from '@activepieces/pieces-framework';
import { sendMessageResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { ConductorSendMessageResult, flattenSendMessageResult } from '../../../common/messaging';
import { whatsscaleProps } from '../../../common/props';
import { ChatType } from '../../../common/types';
import { buildRecipientBody, RecipientType } from '../../../common/recipients';
import { prepareMediaFile } from '../../../common/prepare-file';

export const sendImageManualAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_image_manual',
  classification: 'WRITE',
  displayName: 'Send an Image (By ID)',
  description: 'Send an image to a contact, group, channel, or CRM contact by ID rather than picking from a list.',
  audience: 'ai',
  aiMetadata: { description: 'Sends an image to a recipient identified directly by ID rather than a builder dropdown, with an optional caption. Set recipient_type to contact (phone number with country code), group or channel (bare ID, no @ suffix needed), or crm_contact (WhatsScale CRM contact ID). Takes either a directly downloadable image URL or a file from a previous step. Not idempotent: each call delivers another image.', idempotent: false },
  outputSchema: sendMessageResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    chatType: Property.StaticDropdown({
      displayName: 'Recipient Type',
      description: 'Who this image is being sent to.',
      required: true,
      display: 'cards',
      options: {
        options: [
          { label: 'Contact', value: ChatType.CONTACT, description: 'A phone number with country code', icon: 'user' },
          { label: 'Group', value: ChatType.GROUP, description: 'A WhatsApp group by ID', icon: 'users' },
          { label: 'Channel', value: ChatType.CHANNEL, description: 'A WhatsApp Channel by ID', icon: 'send' },
          { label: 'CRM Contact', value: ChatType.CRM_CONTACT, description: 'A WhatsScale CRM contact by ID', icon: 'tag' },
        ],
      },
    }),
    recipient: Property.ShortText({
      displayName: 'Recipient ID',
      description:
        'Contact: phone number with country code. Group/Channel: the bare ID, no @ suffix needed. CRM Contact: the CRM contact ID.',
      required: true,
    }),
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
  async run(context) {
    const { session, chatType, recipient, imageUrl, caption } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const preparedUrl = await prepareMediaFile({ apiKey, file: imageUrl, files: context.files, mediaType: 'image' });

    const recipientBody = buildRecipientBody(
      RecipientType.MANUAL,
      session,
      recipient,
      chatType,
    );

    const response = await whatsscaleClient(apiKey, HttpMethod.POST, '/api/sendImage', {
      ...recipientBody,
      file: preparedUrl,
      caption: caption ?? '',
    });

    return flattenSendMessageResult(response.body as ConductorSendMessageResult);
  },
});
