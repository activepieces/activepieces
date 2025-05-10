import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { smartsuiteCommon } from '../common';
import { SMARTSUITE_API_URL, API_ENDPOINTS } from '../common/constants';

export const findRecords = createAction({
  name: 'find_records',
  displayName: 'Find Records',
  description: 'Searches for records in the specified table based on criteria',
  auth: smartsuiteAuth,
  props: {
    solution: smartsuiteCommon.solution,
    table: smartsuiteCommon.table,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of records to return (default: 100, max: 1000)',
      required: false,
      defaultValue: 100,
    }),
    sortField: Property.Dropdown({
      displayName: 'Sort Field',
      description: 'Field to sort by',
      required: false,
      refreshers: ['solution', 'table'],
      options: async ({ auth, solution, table }) => {
        if (!auth || !solution || !table) {
          return {
            disabled: true,
            options: [],
          };
        }

        try {
          const fields = await smartsuiteCommon.getTableFields(
            auth as string,
            solution as string,
            table as string
          );

          return {
            disabled: false,
            options: fields
              .filter((field: any) => !field.system)
              .map((field: any) => ({
                label: field.name,
                value: field.id,
              })),
          };
        } catch (error) {
          console.error('Error fetching fields for sorting:', error);
          return {
            disabled: true,
            options: [],
          };
        }
      },
    }),
    sortDirection: Property.StaticDropdown({
      displayName: 'Sort Direction',
      description: 'Direction to sort',
      required: false,
      defaultValue: 'asc',
      options: {
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
      },
    }),
    filterJson: Property.Json({
      displayName: 'Filter (JSON)',
      description: 'JSON filter criteria following SmartSuite API format',
      required: false,
      defaultValue: {},
    }),
  },
  async run({ auth, propsValue }) {
    const { solution, table, limit, sortField, sortDirection, filterJson } = propsValue;

    const requestBody: Record<string, any> = {};

    // Add limit
    if (limit) {
      requestBody['limit'] = Math.min(limit as number, 1000);
    }

    // Add sorting
    if (sortField) {
      requestBody['sort'] = [{
        field: sortField,
        direction: sortDirection || 'asc',
      }];
    }

    // Add filtering
    if (filterJson && Object.keys(filterJson).length > 0) {
      requestBody['filter'] = filterJson;
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${SMARTSUITE_API_URL}${API_ENDPOINTS.LIST_RECORDS
          .replace('{solutionId}', solution as string)
          .replace('{appId}', table as string)}`,
        body: requestBody,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      });

      return response.body;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error(`Invalid filter or sort criteria: ${error.response?.body?.message || 'Please check your filter JSON format'}`);
      }

      if (error.response?.status === 403) {
        throw new Error('You do not have permission to access this table');
      }

      if (error.response?.status === 404) {
        throw new Error(`Solution or table not found: ${solution}/${table}`);
      }

      throw new Error(`Failed to find records: ${error.message || 'Unknown error'}`);
    }
  },
});
