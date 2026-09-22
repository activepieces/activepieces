import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { postVideoCommentOutputSchema } from '../output-schemas';
import { youtubeClient } from '../common/client';

export const youtubePostVideoCommentAction = createAction({
  auth: youtubeAuth,
  outputSchema: postVideoCommentOutputSchema,
  name: 'post_video_comment',
  classification: 'WRITE',
  displayName: 'Post Video Comment',
  description: 'Post a new top-level comment on a video.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Posts a new top-level comment on a YouTube video via commentThreads.insert, as the authenticated account. Use Reply To Comment to answer an existing comment instead of starting a new thread. Comments must be enabled on the video, otherwise YouTube answers 403, and each call posts another comment so retries duplicate it.',
    idempotent: false,
  },
  props: {
    videoId: Property.ShortText({
      displayName: 'Video ID',
      description: 'The `v` parameter in a YouTube URL (e.g. `dQw4w9WgXcQ`).',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Comment Text',
      description: 'The comment body to post.',
      required: true,
    }),
  },
  async run(context) {
    const accessToken = context.auth.access_token;
    const { videoId, text } = context.propsValue;

    return youtubeClient.sendRequest({
      accessToken,
      method: HttpMethod.POST,
      path: '/commentThreads',
      operation: 'Post Video Comment',
      queryParams: { part: 'snippet' },
      body: {
        snippet: {
          videoId,
          topLevelComment: { snippet: { textOriginal: text } },
        },
      },
    });
  },
});
