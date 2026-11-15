import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { facebookPagesAuth } from '../../auth';
import { facebookPagesCommon, GraphRecord } from '../../common/common';
import { createPageVideoPostOutputSchema } from '../../output-schemas';

export const createPageVideoPostAction = createAction({
  auth: facebookPagesAuth,
  name: 'create_page_video_post',
  classification: 'WRITE',
  displayName: 'Create Page Video Post',
  description: 'Publishes a video on a Facebook Page from a video URL.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Publish a video to a Facebook Page from a publicly reachable video URL (up to 1 GB or 20 minutes), with an optional title and description. Facebook processes the video after the call returns. Returns the video ID only, which is not a post ID; find the resulting post with Get Page Posts. Not idempotent: each call uploads a new video.',
    idempotent: false,
  },
  outputSchema: createPageVideoPostOutputSchema,
  props: {
    pageId: facebookPagesCommon.pageId,
    videoUrl: Property.ShortText({
      displayName: 'Video URL',
      description: 'A public URL of the video file that Facebook can download.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Text shown with the video.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return facebookPagesCommon.pageRequest<GraphRecord>({
      auth,
      pageId: propsValue.pageId,
      method: HttpMethod.POST,
      path: `${facebookPagesCommon.objectPath({ id: propsValue.pageId })}/videos`,
      body: { file_url: propsValue.videoUrl.trim(), title: propsValue.title, description: propsValue.description },
    });
  },
});
