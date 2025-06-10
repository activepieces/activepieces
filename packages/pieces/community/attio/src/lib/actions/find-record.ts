import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../index';
import { makeRequest } from '../common/client';

export const findRecordAction = createAction({
  name: 'find_record',
  displayName: 'Find Records',
  description: 'Search for records in Attio using filters and return matching results',
  auth: attioAuth,
  props: {
    object_type: Property.Dropdown({
      displayName: 'Object Type',
      description: 'The type of records to search (e.g., people, companies, deals)',
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
            '/objects'
          );

          if (!response?.data || !Array.isArray(response.data)) {
            throw new Error('Invalid response format from objects endpoint');
          }

          return {
            options: response.data.map((object: any) => {
              return {
                label: object.plural_noun || object?.singular_noun,
                value: object.api_slug,
              };
            }),
          };
        } catch (error) {
          console.error('Error fetching object types:', error);
          return {
            disabled: true,
            placeholder: 'Error fetching object types. Please check your API key.',
            options: [],
          };
        }
      },
    }),
    filter_criteria: Property.Object({
      displayName: 'Simple Filter',
      description: 'Simple filter criteria as key-value pairs (e.g., {"name": "John Doe", "status": "active"}). For complex filters, use the Advanced Filter option instead.',
      required: false,
    }),
    raw_filter: Property.Json({
      displayName: 'Advanced Filter',
      description: 'Advanced filter using Attio\'s filter syntax. This will override the Simple Filter if provided. See Attio API documentation for complex filter structures.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Result Limit',
      description: 'Maximum number of records to return (default: 100, max: 500)',
      required: false,
      defaultValue: 100,
    }),
    offset: Property.Number({
      displayName: 'Result Offset',
      description: 'Number of records to skip for pagination (default: 0)',
      required: false,
      defaultValue: 0,
    }),
  },
  async run({ auth, propsValue }) {
    try {
      const { object_type, filter_criteria, raw_filter, limit, offset } = propsValue;

      if (!object_type) {
        throw new Error('Object type is required');
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
        requestBody['limit'] = Math.min(limit, 500);
      }

      if (offset !== undefined && offset >= 0) {
        requestBody['offset'] = offset;
      }

      const response = await makeRequest(
        auth,
        HttpMethod.POST,
        `/objects/${object_type}/records/query`,
        requestBody
      );

      if (!response?.data) {
        throw new Error('Invalid response from Attio API');
      }

      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to find records: ${errorMessage}`);
    }
  },
});
