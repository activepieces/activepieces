import { createAction } from '@activepieces/pieces-framework';
import { foreplayCoApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { findBrands as findBrandsProperties } from '../properties';
import { findBrandsSchema } from '../schemas';

export const findBrands = createAction({
  name: 'findBrands',
  displayName: 'Find Brands',
  description: 'Search for brands by name with fuzzy matching.',
  props: findBrandsProperties(),
  async run({ auth, propsValue }) {
    // Validate props using Zod schema
    const validation = findBrandsSchema.safeParse(propsValue);
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.message}`);
    }

    const values = propsValue;
    const queryParams: Record<string, string> = {
      query: String(values['query']),
    };

    // Add optional limit parameter if provided
    if (values['limit']) {
      queryParams['limit'] = String(values['limit']);
    }

    const response = await foreplayCoApiCall({
      apiKey: auth as string,
      method: HttpMethod.GET,
      resourceUri: '/api/discovery/brands',
      queryParams,
    });

    const responseBody = response.body;

    // Check if the response is successful
    if (responseBody.metadata && responseBody.metadata.success === true) {
      // Return just the brands data for clean automation workflows
      return responseBody.data;
    } else {
      // Handle error responses by throwing an error
      const errorMessage =
        responseBody.error ||
        responseBody.metadata?.message ||
        'Failed to find brands';
      throw new Error(`Foreplay.co API Error: ${errorMessage}`);
    }
  },
});
