import { createAction, Property } from '@activepieces/pieces-framework';
import { sendMessageResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { ConductorSendMessageResult, flattenSendMessageResult } from '../../../common/messaging';
import { whatsscaleProps } from '../../../common/props';
import { prepareMediaFile } from '../../../common/prepare-file';
import { pollJob } from '../../../common/poll-job';

export const sendVideoToChannelAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_video_to_channel',
  classification: 'WRITE',
  displayName: 'Send a Video to a Channel',
  description: 'Broadcast a video to a WhatsApp Channel selected from the dropdown.',
  audience: 'human',
  aiMetadata: { description: 'Broadcasts a video to a WhatsApp Channel whose ID is chosen from the session channel list, with an optional caption. Pick this for one-to-many channel broadcasts rather than the contact/group/CRM variants used for direct chats. Takes either a directly downloadable video URL or a file from a previous step. Not idempotent: each call posts another video to the channel.', idempotent: false },
  outputSchema: sendMessageResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    channel: whatsscaleProps.channel,
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
    { key: 'destination', display: 'section' as const, label: 'Destination', props: ['session', 'channel'] },
    { key: 'content', display: 'section' as const, label: 'Video', props: ['videoUrl', 'caption'] },
  ],
  async run(context) {
    const { session, channel, videoUrl, caption } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const preparedUrl = await prepareMediaFile({ apiKey, file: videoUrl, files: context.files, mediaType: 'video' });

    const sendResponse = await whatsscaleClient(apiKey, HttpMethod.POST, '/api/sendVideo', {
      session,
      chatId: channel,
      file: preparedUrl,
      caption: caption ?? '',
    });

    const { jobId } = sendResponse.body as { jobId: string };
    const result = await pollJob(apiKey, jobId);
    return flattenSendMessageResult(result as ConductorSendMessageResult);
  },
});
