import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { socialkitAuth } from '../../index';

const socialkitApiUrl = 'https://api.socialkit.dev';

export const getYoutubeDetails = createAction({
  auth: socialkitAuth,
  name: 'get_youtube_details',
  displayName: 'Get YouTube Details',
  description:
    'Get detailed information about any YouTube video including title, description, view count, likes, dislikes, duration, and channel information.',
  props: {
    url: Property.ShortText({
      displayName: 'YouTube Video URL',
      description:
        'The URL of the YouTube video you want to get details from. (e.g., https://www.youtube.com/watch?v=VIDEO_ID)',
      required: true,
    }),
  },
  async run(context) {
    const { url } = context.propsValue;
    const accessKey = context.auth;

    const response = await httpClient.sendRequest<{
      success: boolean;
      data: unknown;
    }>({
      method: HttpMethod.GET,
      url: `${socialkitApiUrl}/youtube/stats`,
      queryParams: {
        access_key: accessKey.secret_text,
        url: url,
      },
    });

    return response.body.data;
  },
});
