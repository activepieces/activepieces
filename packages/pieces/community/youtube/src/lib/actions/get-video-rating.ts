import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { getVideoRatingOutputSchema } from '../output-schemas';
import { youtubeClient } from '../common/client';

export const youtubeGetVideoRatingAction = createAction({
  auth: youtubeAuth,
  outputSchema: getVideoRatingOutputSchema,
  name: 'get_video_rating',
  classification: 'READ',
  displayName: 'Get Video Rating',
  description:
    'Read the rating the connected account has given to one or more videos.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads the authenticated account own rating (like, dislike, none, or unspecified) for up to 50 videos via videos.getRating. Use it before Rate Video to avoid re-applying a rating the account already gave. It reports only the connected account rating, never the public like count, which Get Video Details returns. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    videoIds: Property.ShortText({
      displayName: 'Video IDs',
      description:
        'A video ID, or a comma-separated list of up to 50 IDs (e.g. `dQw4w9WgXcQ,abc123`).',
      required: true,
    }),
  },
  async run(context) {
    const accessToken = context.auth.access_token;
    const { videoIds } = context.propsValue;

    return youtubeClient.sendRequest({
      accessToken,
      method: HttpMethod.GET,
      path: '/videos/getRating',
      operation: 'Get Video Rating',
      queryParams: { id: videoIds },
    });
  },
});
