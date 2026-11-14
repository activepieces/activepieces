import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { snapdubAuth } from '../auth';
import { snapdubClient, SnapDubVideo } from '../common/client';
import { snapdubProps } from '../common/props';

export const getVideoAction = createAction({
  auth: snapdubAuth,
  name: 'get_video',
  classification: 'READ',
  displayName: 'Get Video',
  description:
    'Gets the processing status and progress of a video. Status "done" means its clips are ready.',
  audience: 'both',
  aiMetadata: {
    description:
      'Read one SnapDub video by video_id: status (waiting to start, fetching the video, processing, making the clips, done or failed), progress percent, clip count and error. Use it to check whether clips are ready; use List Clips to get the clips themselves. Safe to retry.',
    idempotent: true,
  },
  props: {
    video_id: snapdubProps.videoIdProp,
  },
  async run(context) {
    return await snapdubClient.call<SnapDubVideo>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/videos/${encodeURIComponent(context.propsValue.video_id.trim())}`,
    });
  },
});
