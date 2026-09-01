import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { getVideoOutputSchema } from '../output-schemas';

export const youtubeGetVideoAction = createAction({
  auth: youtubeAuth,
  outputSchema: getVideoOutputSchema,
  name: 'get_video',
  classification: 'READ',
  displayName: 'Get Video',
  description: 'Retrieve a video by ID, including its statistics and duration.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches full details for one or more YouTube videos by ID using videos.list, returning title, description, tags, duration, view and like counts, and privacy status. Use it after Search or New Video, which give you a video ID but none of these details. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    videoIds: Property.ShortText({
      displayName: 'Video ID',
      description:
        'The video ID, or a comma-separated list of IDs. This is the `v` parameter in a YouTube URL (e.g. `dQw4w9WgXcQ`).',
      required: true,
    }),
  },
  async run(context) {
    const accessToken = context.auth.access_token;
    const { videoIds } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://www.googleapis.com/youtube/v3/videos',
      headers: { Authorization: `Bearer ${accessToken}` },
      queryParams: {
        part: 'snippet,contentDetails,statistics,status',
        id: videoIds,
      },
    });

    return response.body;
  },
});
