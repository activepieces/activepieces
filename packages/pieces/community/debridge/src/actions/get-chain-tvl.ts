import { createAction, Property } from '@activepieces/pieces-framework';
import { debridgeRequest } from '../lib/debridge-api';

export const getChainTvl = createAction({
  name: 'get_chain_tvl',
  displayName: 'Get Chain TVL',
  description: 'Get deBridge TVL for a specific blockchain from DeFiLlama',
  props: {
    chain: Property.ShortText({
      displayName: 'Chain',
      description:
        'Blockchain name to query (e.g. Ethereum, BSC, Polygon, Arbitrum, Avalanche)',
      required: true,
      defaultValue: 'Ethereum',
    }),
  },
  async run(context) {
    const { chain } = context.propsValue;
    const data = await debridgeRequest('/protocol/debridge');
    const chainTvls = data.chainTvls ?? {};
    const currentChainTvls = data.currentChainTvls ?? {};

    // Case-insensitive match
    const matchedKey = Object.keys(chainTvls).find(
      (k) => k.toLowerCase() === chain.toLowerCase()
    );

    if (!matchedKey) {
      const available = Object.keys(chainTvls).join(', ');
      return {
        error: `Chain "${chain}" not found in deBridge data.`,
        availableChains: available,
      };
    }

    const chainInfo = chainTvls[matchedKey];
    const currentTvl = currentChainTvls[matchedKey];

    return {
      chain: matchedKey,
      currentTvl: currentTvl ?? null,
      historicalTvl: typeof chainInfo === 'object' ? chainInfo.tvl : chainInfo,
    };
  },
});
