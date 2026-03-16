import { createAction, Property } from '@activepieces/pieces-framework';
import { birdeyeAuth } from '../../index';
import { birdeyeRequest } from '../common/birdeye-api';
import { CHAIN_OPTIONS } from '../common/chain-dropdown';

export const getTokenOverview = createAction({
  auth: birdeyeAuth,
  name: 'get_token_overview',
  displayName: 'Get Token Overview',
  description: 'Get comprehensive token overview including name, symbol, price, liquidity, volume, and market data.',
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
  },
  async run(context) {
    return birdeyeRequest(context.auth, '/defi/token_overview', context.propsValue.chain as string, {
      address: context.propsValue.address,
    });
  },
});
