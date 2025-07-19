import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { placidAuth } from '../common/auth';
import { placidApiCall } from '../common/client';

export const getImageAction = createAction({
  name: 'get-image',
  auth: placidAuth,
  displayName: 'Get Image',
  description: 'Retrieve a previously generated image by its ID.',
  props: {
    imageId: Property.ShortText({
      displayName: 'Image ID',
      description:
        'The ID of the image to retrieve (returned from create image API).',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { imageId } = propsValue;

    try {
      const response = await placidApiCall({
        apiKey: auth,
        method: HttpMethod.GET,
        resourceUri: `/images/${imageId}`,
      });

      return {
        success: true,
        message: 'Image retrieved successfully',
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
          throw new Error('Image not found: Please verify the Image ID.');
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
