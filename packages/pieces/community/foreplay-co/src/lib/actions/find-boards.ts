import { createAction } from '@activepieces/pieces-framework';
import { foreplayCoApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { findBoards as findBoardsProperties } from '../properties';
import { findBoardsSchema } from '../schemas';

export const findBoards = createAction({
  name: 'findBoards',
  displayName: 'Find Boards',
  description: 'Get all boards for the authenticated user with pagination.',
  props: findBoardsProperties(),
  async run({ auth, propsValue }) {
    // Validate props using Zod schema
    const validation = findBoardsSchema.safeParse(propsValue);
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.message}`);
    }

    const values = propsValue;
    const queryParams: Record<string, string> = {};

    // Add optional parameters if provided
    if (values['offset'] !== undefined) {
      queryParams['offset'] = String(values['offset']);
    }
    if (values['limit'] !== undefined) {
      queryParams['limit'] = String(values['limit']);
    }

    const response = await foreplayCoApiCall({
      apiKey: auth as string,
      method: HttpMethod.GET,
      resourceUri: '/api/boards',
      queryParams,
    });

    const responseBody = response.body;

    // Check if the response is successful
    if (responseBody.metadata && responseBody.metadata.success === true) {
      // Return just the boards data for clean automation workflows
      return responseBody.data;
    } else {
      // Handle error responses by throwing an error
      const errorMessage =
        responseBody.error ||
        responseBody.metadata?.message ||
        'Failed to retrieve boards';
      throw new Error(`Foreplay.co API Error: ${errorMessage}`);
    }
  },
});
