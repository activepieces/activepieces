import { createAction } from '@activepieces/pieces-framework';
import { makeRequest } from '../lib/pancakeswap-api';

export const getChainTvl = createAction({
  name: 'get_chain_tvl',
  displayName: 'Get BNB Chain TVL',
  description: 'Get BNB Chain (BSC) total value locked from DeFiLlama',
  auth: undefined,
  props: {},
  async run() {
    const chains: Array<Record<string, unknown>> = await makeRequest('/v2/chains');

    // Match BNB Chain — DeFiLlama uses "BSC" or "BNB" as the name
    const bnbChain = chains.find(
      (c: Record<string, unknown>) =>
        typeof c['name'] === 'string' &&
        ['bsc', 'bnb', 'bnb chain', 'binance smart chain'].includes(
          c['name'].toLowerCase()
        )
    );

    if (!bnbChain) {
      // Return all chain names to help debug if not found
      return {
        error: 'BNB Chain entry not found',
        availableChains: chains.slice(0, 20).map((c: Record<string, unknown>) => c['name']),
      };
    }

    return {
      name: bnbChain['name'],
      tvl: bnbChain['tvl'],
      tokenSymbol: bnbChain['tokenSymbol'],
      cmcId: bnbChain['cmcId'],
      gecko_id: bnbChain['gecko_id'],
      chainId: bnbChain['chainId'],
      timestamp: new Date().toISOString(),
    };
  },
});
