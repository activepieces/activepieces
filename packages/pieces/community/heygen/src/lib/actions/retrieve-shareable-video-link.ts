import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const retrieveShareableVideoLink = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'retrieveShareableVideoLink',
  displayName: 'Retrieve Shareable Video Link',
  description: 'Generate a public URL for a video, allowing it to be shared and accessed publicly',
  props: {
    video_id: Property.ShortText({
      displayName: 'Video ID',
      description: 'The ID of the video to generate a shareable link for',
      required: true,
    }),
  },
  async run(context) {
    const { video_id } = context.propsValue;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.heygen.com/v1/video/share',
        headers: {
          'x-api-key': context.auth as string,
          'Content-Type': 'application/json',
        },
        body: {
          video_id,
        },
      });

      return {
        success: true,
        video_id: video_id,
        share_url: response.body.data.share_url,
        note: 'This is a public URL that can be shared with anyone to access the video.',
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Video with ID ${video_id} not found.`);
      }
      if (error.response?.status === 403) {
        throw new Error('Authentication failed. Please check your API key.');
      }
      throw new Error(`Failed to generate shareable link: ${error.message}`);
    }
  },
});
