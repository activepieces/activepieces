import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';
import { whatsscaleProps } from '../../common/props';
import { prepareFile } from '../../common/prepare-file';
import { pollJob } from '../../common/poll-job';

export const setVideoStoryAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_set_video_story',
  displayName: 'Set a Video Story',
  description: 'Post a video to your WhatsApp story',
  props: {
    session: whatsscaleProps.session,
    videoUrl: Property.ShortText({
      displayName: 'Video URL',
      required: true,
      description:
        'URL to the video. Supports Google Drive, Dropbox, and direct URLs.',
    }),
    caption: Property.ShortText({
      displayName: 'Caption',
      required: false,
      description: 'Optional caption for the video story',
    }),
  },
  async run(context) {
    const { session, videoUrl, caption } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const preparedUrl = await prepareFile(apiKey, videoUrl);

    const response = await whatsscaleClient(
      apiKey,
      HttpMethod.POST,
      '/api/status/video',
      {
        session,
        file: preparedUrl,
        caption: caption ?? '',
        platform: 'activepieces',
      },
    );

    const { jobId } = response.body as { jobId: string };
    return await pollJob(apiKey, jobId);
  },
});
