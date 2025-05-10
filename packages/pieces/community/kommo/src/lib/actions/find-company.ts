import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { kommoAuth, getAccessTokenOrThrow, getApiUrl } from '../auth';

export const findCompany = createAction({
  name: 'find_company',
  displayName: 'Find Company',
  description: 'Find a company in Kommo by ID, name, or other criteria',
  auth: kommoAuth,
  props: {
    search_type: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'How to search for the company',
      required: true,
      options: {
        options: [
          { label: 'Company ID', value: 'id' },
          { label: 'Company Name', value: 'name' },
          { label: 'Custom Query', value: 'query' },
        ],
      },
      defaultValue: 'id',
    }),
    company_id: Property.Number({
      displayName: 'Company ID',
      description: 'The ID of the company to find',
      required: false,
      defaultValue: 0,
    }),
    company_name: Property.ShortText({
      displayName: 'Company Name',
      description: 'The name of the company to find',
      required: false,
    }),
    custom_query: Property.Object({
      displayName: 'Custom Query',
      description: 'Custom query parameters for searching companies',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const accessToken = getAccessTokenOrThrow(auth);
    const { search_type, company_id, company_name, custom_query } = propsValue;

    let endpoint = 'companies';
    let queryParams: Record<string, any> = {};

    // Handle different search types
    if (search_type === 'id' && company_id) {
      endpoint = `companies/${company_id}`;
    } else if (search_type === 'name' && company_name) {
      queryParams.query = company_name;
    } else if (search_type === 'query' && custom_query) {
      queryParams = { ...queryParams, ...custom_query };
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: getApiUrl(auth, endpoint),
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      queryParams,
    });

    return response.body;
  },
});
