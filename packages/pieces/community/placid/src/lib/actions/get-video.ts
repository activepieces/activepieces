import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { placidAuth } from '../common/auth';
import { placidApiCall } from '../common/client';

export const getVideoAction = createAction({
  name: 'get-video',
  auth: placidAuth,
  displayName: 'Get Video',
  description: 'Retrieve a previously generated video by its ID.',
  props: {
    videoId: Property.ShortText({
      displayName: 'Video ID',
      description:
        'The ID of the video to retrieve (returned from the Create Video API).',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { videoId } = propsValue;

    try {
      const response = await placidApiCall({
        apiKey: auth,
        method: HttpMethod.GET,
        resourceUri: `/videos/${videoId}`,
      });

      return {
        success: true,
        message: 'Video retrieved successfully',
        response,
      };
    } catch (error: any) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      switch (status) {
        case 400:
          throw new Error(`Bad Request: ${message}`);
        case 401:
          throw new Error(
            'Unauthorized: Invalid API key. Please check your credentials.'
          );
        case 404:
          throw new Error('Video not found: Please verify the Video ID.');
        case 429:
          throw new Error('Rate limit exceeded. Please try again later.');
        case 500:
          throw new Error('Internal server error. Please try again later.');
        default:
          throw new Error(
            `Placid API Error (${status || 'Unknown'}): ${message}`
          );
      }
    }
  },
});
