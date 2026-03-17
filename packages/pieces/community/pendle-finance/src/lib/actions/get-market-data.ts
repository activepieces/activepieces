import { createAction, Property } from '@activepieces/pieces-framework';
import { pendleRequest, CHAIN_OPTIONS } from '../common/pendle-api';

export const getMarketData = createAction({
  name: 'get_market_data',
  displayName: 'Get Market Data',
  description: 'Fetch detailed data for a specific Pendle market including PT address, YT address, underlying asset, and APY',
  props: {
    chainId: Property.StaticDropdown({
      displayName: 'Chain',
      description: 'Blockchain network where the market exists',
      required: true,
      options: { options: CHAIN_OPTIONS },
    }),
    marketAddress: Property.ShortText({
      displayName: 'Market Address',
      description: 'The contract address of the Pendle market (e.g. 0x...)',
      required: true,
    }),
  },
  async run(ctx) {
    const { chainId, marketAddress } = ctx.propsValue;
    const data = await pendleRequest<any>(
      `/v1/${chainId}/markets/${marketAddress}`
    );
    return data;
  },
});
