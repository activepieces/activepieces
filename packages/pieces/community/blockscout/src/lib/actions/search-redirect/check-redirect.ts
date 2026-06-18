import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const checkRedirect = createAction({
  name: 'check_redirect',
  displayName: 'Check Search Redirect',
  description: 'Check if a search query should redirect to a specific resource',
  audience: 'both',
  aiMetadata: { description: 'Check whether a search query maps unambiguously to a single resource (address, transaction, block, or token) and should redirect straight to it. Pick this to disambiguate an exact identifier into one entity rather than browsing ranked results from Search. Read-only lookup on eth.blockscout.com.', idempotent: true },
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
