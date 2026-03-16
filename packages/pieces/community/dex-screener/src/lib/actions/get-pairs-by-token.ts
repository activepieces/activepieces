import { createAction, Property } from '@activepieces/pieces-framework';
import { getPairsByToken } from '../dexscreener-api';

export const getPairsByTokenAction = createAction({
  name: 'get_pairs_by_token',
  displayName: 'Get Pairs by Token',
  description: 'Get all DEX trading pairs for a specific token address on a given blockchain.',
  props: {
    chainId: Property.ShortText({
      displayName: 'Chain ID',
      description: 'The blockchain identifier (e.g. "ethereum", "solana", "bsc", "arbitrum", "polygon").',
      required: true,
    }),
    tokenAddresses: Property.ShortText({
      displayName: 'Token Address(es)',
      description: 'Token contract address or multiple addresses separated by commas (max 30).',
      required: true,
    }),
  },
  async run(context) {
    const { chainId, tokenAddresses } = context.propsValue;
    const pairs = await getPairsByToken(chainId, tokenAddresses);
    return {
      pairs,
      count: pairs.length,
      chainId,
    };
  },
});
