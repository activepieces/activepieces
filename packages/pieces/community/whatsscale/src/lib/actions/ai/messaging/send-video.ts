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
import { pollJob } from '../../../common/poll-job';

export const sendVideoManualAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_video_manual',
  classification: 'WRITE',
  displayName: 'Send a Video (By ID)',
  description: 'Send a video to a contact, group, channel, or CRM contact by ID rather than picking from a list.',
  audience: 'ai',
  aiMetadata: { description: 'Sends a video to a recipient identified directly by ID rather than a builder dropdown, with an optional caption. Set recipient_type to contact (phone number with country code), group or channel (bare ID, no @ suffix needed), or crm_contact (WhatsScale CRM contact ID). Requires a directly downloadable video URL; the send completes asynchronously. Not idempotent: each call delivers another video.', idempotent: false },
  outputSchema: sendMessageResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    chatType: Property.StaticDropdown({
      displayName: 'Recipient Type',
      description: 'Who this video is being sent to.',
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
    const result = await pollJob(apiKey, jobId);
    return flattenSendMessageResult(result as ConductorSendMessageResult);
  },
});
