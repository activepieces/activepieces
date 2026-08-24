import { createAction, Property } from '@activepieces/pieces-framework';
import { sendMessageResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { ConductorSendMessageResult, flattenSendMessageResult } from '../../../common/messaging';
import { whatsscaleProps } from '../../../common/props';
import { prepareMediaFile } from '../../../common/prepare-file';
import { pollJob } from '../../../common/poll-job';

export const sendVideoToGroupAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_video_to_group',
  classification: 'WRITE',
  displayName: 'Send a Video to a Group',
  description: 'Send a video to a WhatsApp group selected from the dropdown.',
  audience: 'human',
  aiMetadata: { description: 'Sends a video to a WhatsApp group whose chat ID is chosen from the session group list, with an optional caption. Pick this when the recipient is a known group; use the manual-entry video action instead to target a raw group ID, or the contact/CRM/channel variants for other recipient types. Takes either a directly downloadable video URL or a file from a previous step. Not idempotent: each call delivers another video.', idempotent: false },
  outputSchema: sendMessageResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    group: whatsscaleProps.group,
    videoUrl: Property.File({
      displayName: 'Video',
      description: 'A direct URL to the video, or a file from a previous step.',
      required: true,
    }),
    caption: Property.ShortText({
      displayName: 'Caption',
      description: 'Optional caption for the video (max 1024 characters).',
      required: false,
    }),
  },
  propertyGroups: [
    { key: 'destination', display: 'section' as const, label: 'Destination', props: ['session', 'group'] },
    { key: 'content', display: 'section' as const, label: 'Video', props: ['videoUrl', 'caption'] },
  ],
  async run(context) {
    const { session, group, videoUrl, caption } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const preparedUrl = await prepareMediaFile({ apiKey, file: videoUrl, files: context.files, mediaType: 'video' });

    const sendResponse = await whatsscaleClient(apiKey, HttpMethod.POST, '/api/sendVideo', {
      session,
      chatId: group,
      file: preparedUrl,
      caption: caption ?? '',
    });

    const { jobId } = sendResponse.body as { jobId: string };
    const result = await pollJob(apiKey, jobId);
    return flattenSendMessageResult(result as ConductorSendMessageResult);
  },
});
