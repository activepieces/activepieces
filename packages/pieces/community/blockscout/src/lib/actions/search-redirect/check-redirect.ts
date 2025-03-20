import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const checkRedirect = createAction({
  name: 'check_redirect',
  displayName: 'Check Search Redirect',
  description: 'Check if a search query should redirect to a specific resource',
  // category: 'Search',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search query to check for redirect',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/search/check-redirect`,
      queryParams: {
        q: context.propsValue.query
      },
    });
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`);
    }
    return response.body;
  },
});
