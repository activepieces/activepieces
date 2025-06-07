import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../index';
import { makeRequest } from '../common/client';

export const findListEntryAction = createAction({
  name: 'find_list_entry',
  displayName: 'Find List Entry',
  description: 'Search for entries in a specific list in Attio using filters and return matching results',
  auth: attioAuth,
  props: {
    list_id: Property.Dropdown({
      displayName: 'List',
      description: 'The list to search entries in',
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

          if (!response?.data || !Array.isArray(response.data)) {
            throw new Error('Invalid response format from lists endpoint');
          }

          return {
            options: response.data.map((list: any) => ({
              label: list.name || 'Unknown List',
              value: list.id,
            })),
          };
        } catch (error) {
          console.error('Error fetching lists:', error);
          return {
            disabled: true,
            placeholder: 'Error fetching lists. Please check your API key.',
            options: [],
          };
        }
      },
    }),
    filter_criteria: Property.Object({
      displayName: 'Simple Filter',
      description: 'Simple filter criteria as key-value pairs (e.g., {"status": "active", "priority": "high"}). For complex filters, use the Advanced Filter option instead.',
      required: false,
    }),
    raw_filter: Property.Json({
      displayName: 'Advanced Filter',
      description: 'Advanced filter using Attio\'s filter syntax. This will override the Simple Filter if provided. See Attio API documentation for complex filter structures.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Result Limit',
      description: 'Maximum number of entries to return (default: 100, max: 500)',
      required: false,
      defaultValue: 100,
    }),
    offset: Property.Number({
      displayName: 'Result Offset',
      description: 'Number of entries to skip for pagination (default: 0)',
      required: false,
      defaultValue: 0,
    }),
  },
  async run({ auth, propsValue }) {
    try {
      const { list_id, filter_criteria, raw_filter, limit, offset } = propsValue;

      if (!list_id) {
        throw new Error('List ID is required');
      }

      let filter = raw_filter;

      if (!filter && filter_criteria && typeof filter_criteria === 'object') {
        const filterEntries = Object.entries(filter_criteria)
          .filter(([_, value]) => value !== null && value !== undefined && value !== '')
          .map(([key, value]) => ({ [key]: value }));

        if (filterEntries.length > 1) {
          filter = { $and: filterEntries };
        } else if (filterEntries.length === 1) {
          filter = filterEntries[0];
        }
      }

      const requestBody: Record<string, unknown> = {};

      if (filter) {
        requestBody['filter'] = filter;
      }

      if (limit !== undefined && limit > 0) {
        requestBody['limit'] = Math.min(limit, 5);
      }

      if (offset !== undefined && offset >= 0) {
        requestBody['offset'] = offset;
      }

      const response = await makeRequest(
        auth,
        HttpMethod.POST,
        `/lists/${list_id}/entries/query`,
        requestBody
      );

      if (!response?.data) {
        throw new Error('Invalid response from Attio API');
      }

      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to find list entries: ${errorMessage}`);
    }
  },
});
