import { createAction, Property } from '@activepieces/pieces-framework';
import { sendMessageResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { ConductorSendMessageResult, flattenSendMessageResult } from '../../../common/messaging';
import { whatsscaleProps } from '../../../common/props';
import { prepareMediaFile } from '../../../common/prepare-file';

export const sendImageToGroupAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_image_to_group',
  classification: 'WRITE',
  displayName: 'Send an Image to a Group',
  description: 'Send an image to a WhatsApp group selected from the dropdown.',
  audience: 'human',
  aiMetadata: { description: 'Sends an image to a WhatsApp group whose chat ID is chosen from the session group list, with an optional caption. Pick this when the recipient is a known group; use the manual-entry image action to target a raw group ID, or the contact/CRM/channel variants for other recipient types. Takes either a directly downloadable image URL or a file from a previous step. Not idempotent: each call delivers another image.', idempotent: false },
  outputSchema: sendMessageResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    group: whatsscaleProps.group,
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
    const { session, group, imageUrl, caption } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const preparedUrl = await prepareMediaFile({ apiKey, file: imageUrl, files: context.files, mediaType: 'image' });

    const response = await whatsscaleClient(apiKey, HttpMethod.POST, '/api/sendImage', {
      session,
      chatId: group,
      file: preparedUrl,
      caption: caption ?? '',
    });

    return flattenSendMessageResult(response.body as ConductorSendMessageResult);
  },
});
