import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const search = createAction({
  name: 'search',
  displayName: 'Search',
  description: 'Search for addresses, transactions, blocks, or tokens',
  audience: 'both',
  aiMetadata: { description: 'Run a free-text search across the chain for addresses, transactions, blocks, and tokens, returning ranked matches. Pick this when you have a name, symbol, or partial identifier and need to resolve it to an entity; use the dedicated by-hash lookups when you already hold an exact hash. Read-only lookup on eth.blockscout.com.', idempotent: true },
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
