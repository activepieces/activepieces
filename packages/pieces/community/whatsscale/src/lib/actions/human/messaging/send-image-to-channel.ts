import { createAction, Property } from '@activepieces/pieces-framework';
import { sendMessageResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { ConductorSendMessageResult, flattenSendMessageResult } from '../../../common/messaging';
import { whatsscaleProps } from '../../../common/props';
import { prepareMediaFile } from '../../../common/prepare-file';

export const sendImageToChannelAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_image_to_channel',
  classification: 'WRITE',
  displayName: 'Send an Image to a Channel',
  description: 'Broadcast an image to a WhatsApp Channel selected from the dropdown.',
  audience: 'human',
  aiMetadata: { description: 'Broadcasts an image to a WhatsApp Channel whose ID is chosen from the session channel list, with an optional caption. Pick this for one-to-many channel broadcasts rather than the contact/group/CRM variants used for direct chats. Takes either a directly downloadable image URL or a file from a previous step. Not idempotent: each call posts another image to the channel.', idempotent: false },
  outputSchema: sendMessageResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    channel: whatsscaleProps.channel,
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
    const { session, channel, imageUrl, caption } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const preparedUrl = await prepareMediaFile({ apiKey, file: imageUrl, files: context.files, mediaType: 'image' });

    const response = await whatsscaleClient(apiKey, HttpMethod.POST, '/api/sendImage', {
      session,
      chatId: channel,
      file: preparedUrl,
      caption: caption ?? '',
    });

    return flattenSendMessageResult(response.body as ConductorSendMessageResult);
  },
});
