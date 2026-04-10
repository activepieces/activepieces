import { createAction, Property, HttpMethod } from '@activepieces/pieces-framework';
import { canvaCommon } from '../common';

export const findDesignAction = createAction({
  name: 'find_design',
  displayName: 'Find Design',
  description: 'Search for designs by title or other criteria.',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Text to search for in design titles or descriptions.',
      required: true,
    }),
    folderId: { ...canvaCommon.folderId, required: false },
    limit: Property.Number({
        displayName: 'Limit',
        description: 'Maximum number of results to return.',
        required: false,
        defaultValue: 10,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { query, folderId, limit } = propsValue;

    const queryParams: Record<string, any> = {
      q: query, // Common parameter for search queries
      limit: limit,
    };

    if (folderId) {
        queryParams.folder_id = folderId;
    }

    const response = await canvaCommon.makeRequest(
      auth.access_token,
      HttpMethod.GET,
      '/designs',
      undefined,
      queryParams
    );

    return {
      designs: response.data,
      count: response.count,
      message: 'Designs found successfully.',
    };
  },
});
