import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../index';
import { makeRequest } from '../common/client';

export const findListEntryAction = createAction({
  name: 'find_list_entry',
  displayName: 'Find List Entry',
  description: 'Find entries in a list in Attio based on criteria',
  auth: attioAuth,
  props: {
    list_id: Property.Dropdown({
      displayName: 'List',
      description: 'The list to search in',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first',
            options: [],
          };
        }

        try {
          const response = await makeRequest(
            auth as string,
            HttpMethod.GET,
            '/lists'
          );

          return {
            options: response.data.map((list: any) => {
              return {
                label: list.name,
                value: list.id,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Error fetching lists',
            options: [],
          };
        }
      },
    }),
    filter_criteria: Property.Object({
      displayName: 'Filter Criteria',
      description: 'Simple filter criteria as key-value pairs. For advanced filtering, use the raw filter option.',
      required: false,
    }),
    raw_filter: Property.Json({
      displayName: 'Raw Filter',
      description: 'Advanced filter in Attio format. See Attio API docs for complex filter structures. Will override simple filter criteria if provided.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Result Limit',
      description: 'Maximum number of entries to return',
      required: false,
      defaultValue: 100,
    }),
    offset: Property.Number({
      displayName: 'Result Offset',
      description: 'Number of entries to skip',
      required: false,
      defaultValue: 0,
    }),
  },
  async run({ auth, propsValue }) {
    const { list_id, filter_criteria, raw_filter, limit, offset } = propsValue;

    // Build the request body
    let filter = raw_filter;

    // If no raw filter is provided, build one from the filter criteria
    if (!filter && filter_criteria) {
      // Create simple filter entries for each key-value pair
      const filterEntries = Object.entries(filter_criteria).map(([key, value]) => {
        // For simple key-value pairs
        return { [key]: value };
      });

      // If we have multiple criteria, combine them with $and
      if (filterEntries.length > 1) {
        filter = { $and: filterEntries };
      } else if (filterEntries.length === 1) {
        // Just use the single filter entry
        filter = filterEntries[0];
      }
    }

    // Prepare request body
    const requestBody: Record<string, unknown> = {};

    // Add filter if specified
    if (filter) {
      requestBody['filter'] = filter;
    }

    // Add pagination parameters
    if (limit !== undefined) {
      requestBody['limit'] = limit;
    }

    if (offset !== undefined) {
      requestBody['offset'] = offset;
    }

    // Make the request to the correct endpoint using POST
    const response = await makeRequest(
      auth,
      HttpMethod.POST,
      `/lists/${list_id}/entries/query`,
      requestBody
    );

    return response;
  },
});
