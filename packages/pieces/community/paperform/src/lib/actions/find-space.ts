import { createAction, Property } from '@activepieces/pieces-framework';
import { PaperformAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findSpace = createAction({
  auth: PaperformAuth,
  name: 'findSpace',
  displayName: 'Find Space',
  description: 'Retrieve space details by name or ID',
  props: {
    search_by: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'How to search for the space',
      required: true,
      options: {
        options: [
          { label: 'Space ID', value: 'id' },
          { label: 'Space Name', value: 'name' },
        ],
      },
    }),
    search_value: Property.ShortText({
      displayName: 'Search Value',
      description: 'The ID or name of the space to find',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'The number of results to return (max 100)',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { search_by, search_value, limit } = context.propsValue;
    const apiKey = context.auth as string;

    let response;
    let foundSpace;

    if (search_by === 'id') {
      // If searching by ID, try to get the specific space directly
      try {
        response = await makeRequest(
          apiKey,
          HttpMethod.GET,
          `/spaces/${search_value}`
        );
        foundSpace = response;
      } catch (error: any) {
        if (error.message.includes('404')) {
          return {
            success: false,
            error: 'space_not_found',
            message: `Space with ID "${search_value}" was not found`,
            search_by,
            search_value,
          };
        }
        throw error;
      }
    } else {
      // If searching by name, use the search endpoint
      const queryParams = new URLSearchParams();
      queryParams.append('search', search_value);
      queryParams.append('limit', (limit || 20).toString());

      response = await makeRequest(
        apiKey,
        HttpMethod.GET,
        `/spaces?${queryParams.toString()}`
      );

      const spaces = response.data || response;

      if (!Array.isArray(spaces)) {
        return {
          success: false,
          error: 'invalid_response',
          message: 'Invalid response format from API',
        };
      }

      // Find exact or partial match
      foundSpace =
        spaces.find(
          (space: any) =>
            space.name &&
            space.name.toLowerCase().includes(search_value.toLowerCase())
        ) || spaces[0]; // Take first result if no exact match

      if (!foundSpace || spaces.length === 0) {
        return {
          success: false,
          error: 'space_not_found',
          message: `Space with name containing "${search_value}" was not found`,
          search_by,
          search_value,
        };
      }
    }

    return {
      success: true,
      message: `Successfully found space with ${search_by} "${search_value}"`,
      space: foundSpace,
      search_by,
      search_value,
    };
  },
});
