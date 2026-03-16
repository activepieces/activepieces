import { createAction, Property } from '@activepieces/pieces-framework';
import { blockchairRequest } from '../common/blockchair-api';

export const search = createAction({
  name: 'search',
  displayName: 'Search',
  description:
    'Cross-chain search: find which blockchain an address, transaction hash, or block belongs to.',
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description:
        'Address, transaction hash, or block hash/height to search across all supported chains',
      required: true,
    }),
  },
  async run(context) {
    const apiKey = context.auth as string | undefined;
    const { query } = context.propsValue;
    return await blockchairRequest('/search', apiKey, { q: query });
  },
});
