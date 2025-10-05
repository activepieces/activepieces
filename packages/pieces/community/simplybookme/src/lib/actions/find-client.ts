import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplybookAuth, getAccessToken, SimplybookAuth } from '../common';

export const findClient = createAction({
  auth: simplybookAuth,
  name: 'find_client',
  displayName: 'Find Client',
  description: 'Find clients with search and pagination',
  props: {
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number in the list',
      required: false,
      defaultValue: 1
    }),
    onPage: Property.Number({
      displayName: 'Items Per Page',
      description: 'Number of items per page',
      required: false,
      defaultValue: 25
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Search string to filter clients by name, email, or phone',
      required: false
    })
  },
  async run(context) {
    const auth = context.auth as SimplybookAuth;
    const accessToken = await getAccessToken(auth);

    // Build query parameters
    const queryParams: string[] = [];

    // Pagination
    if (context.propsValue.page) {
      queryParams.push(`page=${context.propsValue.page}`);
    }
    if (context.propsValue.onPage) {
      queryParams.push(`on_page=${context.propsValue.onPage}`);
    }

    // Search filter
    if (context.propsValue.search) {
      queryParams.push(`filter[search]=${encodeURIComponent(context.propsValue.search)}`);
    }

    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://user-api-v2.simplybook.me/admin/clients${queryString}`,
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Login': auth.companyLogin,
          'X-Token': accessToken
        }
      });

      return response.body;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Failed to find clients: ${error.response.status} - ${JSON.stringify(error.response.body)}`
        );
      }
      throw new Error(`Failed to find clients: ${error.message}`);
    }
  }
});
