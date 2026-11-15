import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { rateVideoOutputSchema } from '../output-schemas';
import { youtubeClient } from '../common/client';

export const youtubeRateVideoAction = createAction({
  auth: youtubeAuth,
  outputSchema: rateVideoOutputSchema,
  name: 'rate_video',
  classification: 'WRITE',
  displayName: 'Rate Video',
  description: 'Like, dislike, or remove the rating on a video.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sets the authenticated account rating on a YouTube video via videos.rate, using like, dislike, or none to clear an existing rating. Use Get Video Rating to read the current rating first. The call replaces whatever rating was there, so applying the same value again changes nothing.',
    idempotent: true,
  },
  props: {
    videoId: Property.ShortText({
      displayName: 'Video ID',
      description: 'The `v` parameter in a YouTube URL (e.g. `dQw4w9WgXcQ`).',
      required: true,
    }),
    rating: Property.StaticDropdown({
      displayName: 'Rating',
      description: 'The rating to apply. None removes any existing rating.',
      required: true,
      options: {
        options: [
          { label: 'Like', value: 'like' },
          { label: 'Dislike', value: 'dislike' },
          { label: 'None (remove rating)', value: 'none' },
        ],
      },
    }),
  },
  async run(context) {
    const accessToken = context.auth.access_token;
    const { videoId, rating } = context.propsValue;

    await youtubeClient.sendRequest({
      accessToken,
      method: HttpMethod.POST,
      path: '/videos/rate',
      operation: 'Rate Video',
      queryParams: { id: videoId, rating },
    });

    return { success: true, videoId, rating };
  },
});
