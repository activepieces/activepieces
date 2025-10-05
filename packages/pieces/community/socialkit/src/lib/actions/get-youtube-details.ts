import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { socialkitAuth } from '../../index'; 

const socialkitApiUrl = 'https://api.socialkit.dev';

export const getYoutubeDetails = createAction({
  name: 'get_youtube_details',
  displayName: 'Get YouTube Details',
  description: 'Fetch metadata/details of a YouTube video (e.g., title, views, likes).',
  props: {
    url: Property.ShortText({
      displayName: 'YouTube Video URL',
      description: 'The URL of the YouTube video you want to get details from.',
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
        access_key: accessKey as string,
        url: url,
      },
    });


    return response.body.data;
  },
});