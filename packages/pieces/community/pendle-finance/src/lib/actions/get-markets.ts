import { createAction, Property } from '@activepieces/pieces-framework';
import { pendleRequest, CHAIN_OPTIONS } from '../common/pendle-api';

export const getMarkets = createAction({
  name: 'get_markets',
  displayName: 'Get Markets',
  description: 'List active Pendle yield markets on a given chain with APY, expiry, and TVL data',
  props: {
    chainId: Property.StaticDropdown({
      displayName: 'Chain',
      description: 'Blockchain network to query',
      required: true,
      options: { options: CHAIN_OPTIONS },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of markets to return (default: 20)',
      required: false,
      defaultValue: 20,
    }),
    skip: Property.Number({
      displayName: 'Skip',
      description: 'Number of markets to skip for pagination (default: 0)',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(ctx) {
    const { chainId, limit, skip } = ctx.propsValue;
    const effectiveLimit = limit ?? 20;
    const effectiveSkip = skip ?? 0;
    const data = await pendleRequest<any>(
      `/v1/${chainId}/markets?limit=${effectiveLimit}&skip=${effectiveSkip}`
    );
    return data;
  },
});
