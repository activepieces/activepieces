import { createAction } from '@activepieces/pieces-framework';
import { FacebookPageDropdown, facebookPagesCommon } from '../common/common';
import { facebookPagesAuth } from '../..';

export const createVideoPost = createAction({
  auth: facebookPagesAuth,
  name: 'create_video_post',
  displayName: 'Create Page Video',
  description: 'Create a video on a Facebook Page you manage',
  audience: 'both',
  aiMetadata: { description: 'Publishes a video post to a Facebook Page the connected account manages by uploading a video from a publicly reachable URL, with an optional title and description. Choose this for video content rather than text or photo posts. Requires a managed page and a video URL Facebook can fetch (limit 1GB or 20 minutes); not idempotent, as each call uploads a new video.', idempotent: false },
  props: {
    page: facebookPagesCommon.page,
    video: facebookPagesCommon.video,
    title: facebookPagesCommon.title,
    description: facebookPagesCommon.description,
  },
  async run(context) {
    const page: FacebookPageDropdown = context.propsValue.page!;

    const result = await facebookPagesCommon.createVideoPost(
      page,
      context.propsValue.title,
      context.propsValue.description,
      context.propsValue.video
    );

    return result;
  },
});
