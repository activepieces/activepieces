import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const search = createAction({
  name: 'search',
  displayName: 'Search',
  description: 'Search for addresses, transactions, blocks, or tokens',
  // category: 'Search',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search query for addresses, transactions, blocks, or tokens',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/search`,
      queryParams: {
        q: context.propsValue['query']
      },
    });
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`);
    }
    return response.body;
  },
});
