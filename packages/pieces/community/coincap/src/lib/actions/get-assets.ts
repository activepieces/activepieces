import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../coincap-api';

export const getAssets = createAction({
  name: 'get_assets',
  displayName: 'Get Assets',
  description:
    'List top cryptocurrencies with price, market cap, volume, and supply data.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of results to return (default 20, max 2000).',
      required: false,
      defaultValue: 20,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of results to skip for pagination.',
      required: false,
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Filter by asset ID, name, or symbol (e.g. "bitcoin", "BTC").',
      required: false,
    }),
  },
  async run(context) {
    const { limit, offset, search } = context.propsValue;
    return makeRequest(HttpMethod.GET, '/assets', {
      limit,
      offset,
      search,
    });
  },
});
