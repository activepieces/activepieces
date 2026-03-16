import { createAction, Property } from '@activepieces/pieces-framework';
import { birdeyeAuth } from '../../index';
import { birdeyeRequest } from '../common/birdeye-api';
import { CHAIN_OPTIONS } from '../common/chain-dropdown';

export const getTokenPrice = createAction({
  auth: birdeyeAuth,
  name: 'get_token_price',
  displayName: 'Get Token Price',
  description: 'Fetch real-time price data for a token on any supported chain.',
  props: {
    address: Property.ShortText({
      displayName: 'Token Address',
      description: 'The token contract address (or mint address for Solana)',
      required: true,
    }),
    chain: Property.StaticDropdown({
      displayName: 'Chain',
      description: 'The blockchain network to query',
      required: true,
      options: { options: CHAIN_OPTIONS },
      defaultValue: 'solana',
    }),
    check_liquidity: Property.Number({
      displayName: 'Check Liquidity',
      description: 'Minimum liquidity threshold in USD (optional)',
      required: false,
    }),
  },
  async run(context) {
    const params: Record<string, string | number | undefined> = {
      address: context.propsValue.address,
      chain: context.propsValue.chain as string,
    };
    if (context.propsValue.check_liquidity) {
      params['check_liquidity'] = context.propsValue.check_liquidity;
    }
    return birdeyeRequest(context.auth, '/defi/price', params);
  },
});
