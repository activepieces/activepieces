import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';
import { whatsscaleProps } from '../../common/props';
import { prepareFile } from '../../common/prepare-file';
import { pollJob } from '../../common/poll-job';

export const sendVideoToContactAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_video_to_contact',
  displayName: 'Send a Video to a Contact',
  description: 'Send a video to a WhatsApp contact selected from the dropdown.',
  props: {
    session: whatsscaleProps.session,
    contact: whatsscaleProps.contact,
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
    const { session, contact, videoUrl, caption } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const preparedUrl = await prepareFile(apiKey, videoUrl);

    const sendResponse = await whatsscaleClient(apiKey, HttpMethod.POST, '/api/sendVideo', {
      session,
      chatId: contact,
      file: preparedUrl,
      caption: caption ?? '',
      platform: 'activepieces',
    });

    const { jobId } = sendResponse.body as { jobId: string };
    return await pollJob(apiKey, jobId);
  },
});
