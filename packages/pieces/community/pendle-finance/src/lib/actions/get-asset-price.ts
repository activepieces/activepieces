import { createAction, Property } from '@activepieces/pieces-framework';
import { pendleRequest, CHAIN_OPTIONS } from '../common/pendle-api';

export const getAssetPrice = createAction({
  name: 'get_asset_price',
  displayName: 'Get Asset Price',
  description: 'Fetch PT price, YT price, and underlying asset price for a Pendle market',
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
      `/v1/sdk/${chainId}/markets/${marketAddress}/asset/price`
    );
    return data;
  },
});
