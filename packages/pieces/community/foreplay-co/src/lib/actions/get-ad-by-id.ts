import { createAction } from '@activepieces/pieces-framework';
import { foreplayCoApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { getAdById as getAdByIdProperties } from '../properties';
import { getAdByIdSchema } from '../schemas';

export const getAdById = createAction({
  name: 'getAdById',
  displayName: 'Get Ad by ID',
  description: 'Get detailed information about a specific ad by its ID.',
  props: getAdByIdProperties(),
  async run({ auth, propsValue }) {
    // Validate props using Zod schema
    const validation = getAdByIdSchema.safeParse(propsValue);
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.message}`);
    }

    const adId = propsValue.ad_id;

    const response = await foreplayCoApiCall({
      apiKey: auth as string,
      method: HttpMethod.GET,
      resourceUri: `/api/ad/${adId}`,
    });

    const responseBody = response.body;

    // Check if the response is successful
    if (responseBody.metadata && responseBody.metadata.success === true) {
      // Return just the ad data for clean automation workflows
      return responseBody.data;
    } else {
      // Handle error responses by throwing an error
      const errorMessage =
        responseBody.error ||
        responseBody.metadata?.message ||
        'Failed to retrieve ad';
      throw new Error(`Foreplay.co API Error: ${errorMessage}`);
    }
  },
});
