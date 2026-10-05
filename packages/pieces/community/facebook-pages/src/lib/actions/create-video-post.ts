import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { facebookPagesAuth } from '../auth';
import { facebookPagesCommon } from '../common/common';
import { createVideoPostActionOutputSchema } from '../output-schemas';

export const createVideoPost = createAction({
  auth: facebookPagesAuth,
  name: 'create_video_post',
  classification: 'WRITE',
  displayName: 'Create Page Video',
  description: 'Create a video on a Facebook Page you manage',
  audience: 'human',
  aiMetadata: { description: 'Publishes a video post to a Facebook Page the connected account manages by uploading a video from a publicly reachable URL, with an optional title and description. Choose this for video content rather than text or photo posts. Requires a managed page and a video URL Facebook can fetch (limit 1GB or 20 minutes); not idempotent, as each call uploads a new video.', idempotent: false },
  outputSchema: createVideoPostActionOutputSchema,
  props: {
    page: facebookPagesCommon.page,
    video: facebookPagesCommon.video,
    title: facebookPagesCommon.title,
    description: facebookPagesCommon.description,
  },
  async run({ propsValue }) {
    return facebookPagesCommon.graphRequest({
      accessToken: propsValue.page.accessToken,
      method: HttpMethod.POST,
      path: `${facebookPagesCommon.objectPath({ id: propsValue.page.id })}/videos`,
      body: { title: propsValue.title, description: propsValue.description, file_url: propsValue.video },
    });
  },
});
