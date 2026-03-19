import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';
import { whatsscaleProps } from '../../common/props';
import { ChatType } from '../../common/types';
import { buildRecipientBody, RecipientType } from '../../common/recipients';
import { prepareFile } from '../../common/prepare-file';
import { pollJob } from '../../common/poll-job';

export const sendVideoManualAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_video_manual',
  displayName: 'Send a Video (Manual Entry)',
  description: 'Send a video by entering a phone number or group ID manually.',
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
    videoUrl: Property.ShortText({
      displayName: 'Video URL',
      description: 'Direct URL to the video file.',
      required: true,
    }),
    caption: Property.ShortText({
      displayName: 'Caption',
      description: 'Optional caption for the video (max 1024 characters).',
      required: false,
    }),
  },
  async run(context) {
    const { session, chatType, recipient, videoUrl, caption } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const preparedUrl = await prepareFile(apiKey, videoUrl);

    const recipientBody = buildRecipientBody(
      RecipientType.MANUAL,
      session,
      recipient,
      chatType as ChatType,
    );

    const sendResponse = await whatsscaleClient(apiKey, HttpMethod.POST, '/api/sendVideo', {
      ...recipientBody,
      file: preparedUrl,
      caption: caption ?? '',
    });

    const { jobId } = sendResponse.body as { jobId: string };
    return await pollJob(apiKey, jobId);
  },
});
