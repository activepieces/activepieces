import { createAction, Property } from '@activepieces/pieces-framework';
import { sendMessageResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { whatsscaleProps } from '../../../common/props';
import { prepareMediaFile } from '../../../common/prepare-file';
import { pollJob } from '../../../common/poll-job';
import { ConductorSendMessageResult, flattenSendMessageResult } from '../../../common/messaging';

export const postVideoStatusAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_post_video_status',
  classification: 'WRITE',
  displayName: 'Post a Video Status',
  description: 'Post a video WhatsApp Status (story) with an optional caption.',
  audience: 'both',
  aiMetadata: { description: 'Posts a video WhatsApp Status update visible to your contacts for 24 hours, with an optional caption. This broadcasts to your status feed, not to a specific recipient. Takes either a directly downloadable video URL or a file from a previous step; the post completes asynchronously. Not idempotent: each call posts another status.', idempotent: false },
  outputSchema: sendMessageResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    videoUrl: Property.File({
      displayName: 'Video',
      description: 'A direct URL to the video, or a file from a previous step.',
      required: true,
    }),
    caption: Property.ShortText({
      displayName: 'Caption',
      description: 'Optional caption for the status.',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth.secret_text;
    const { session, videoUrl, caption } = context.propsValue;

    const preparedUrl = await prepareMediaFile({ apiKey: auth, file: videoUrl, files: context.files, mediaType: 'video' });

    const body: Record<string, unknown> = { session, file: preparedUrl };
    if (caption) body['caption'] = caption;

    const sendResponse = await whatsscaleClient(auth, HttpMethod.POST, '/api/status/video', body);
    const { jobId } = sendResponse.body as { jobId: string };
    const result = await pollJob(auth, jobId);
    return flattenSendMessageResult(result as ConductorSendMessageResult);
  },
});
