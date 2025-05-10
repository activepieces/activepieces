import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { smartsuiteCommon, handleSmartSuiteError } from '../common';
import { SMARTSUITE_API_URL, API_ENDPOINTS } from '../common/constants';

export const searchRecords = createAction({
  name: 'search_records',
  displayName: 'Search Records',
  description: 'Search for records in a table with filters and pagination',
  auth: smartsuiteAuth,
  props: {
    solution: smartsuiteCommon.solution,
    table: smartsuiteCommon.table,
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The search query to filter records',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page Number',
      description: 'The page number for pagination (starts from 1)',
      required: false,
      defaultValue: 1,
    }),
    perPage: Property.Number({
      displayName: 'Records Per Page',
      description: 'Number of records to return per page',
      required: false,
      defaultValue: 50,
    }),
    sortBy: Property.ShortText({
      displayName: 'Sort By',
      description: 'Field to sort by (e.g., "created_at")',
      required: false,
    }),
    sortOrder: Property.Dropdown({
      displayName: 'Sort Order',
      description: 'The order to sort the results',
      required: false,
      options: {
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { solution, table, query, page, perPage, sortBy, sortOrder } = propsValue;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${SMARTSUITE_API_URL}${API_ENDPOINTS.SEARCH_RECORDS
          .replace('{solutionId}', solution as string)
          .replace('{appId}', table as string)}`,
        queryParams: {
          ...(query && { q: query }),
          ...(page && { page: page.toString() }),
          ...(perPage && { per_page: perPage.toString() }),
          ...(sortBy && { sort_by: sortBy }),
          ...(sortOrder && { sort_order: sortOrder }),
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      });

      return response.body;
    } catch (error) {
      const smartSuiteError = handleSmartSuiteError(error);
      throw new Error(smartSuiteError.message);
    }
  },
}); 