import { createAction } from '@activepieces/pieces-framework';
import { getChainStats } from '../lib/osmosis-api';

export const getChainStatsAction = createAction({
  name: 'get_chain_stats',
  displayName: 'Get Chain Stats',
  description: 'Retrieve Osmosis chain TVL and statistics from DeFiLlama\'s chain rankings, showing Osmosis\'s position in the Cosmos ecosystem.',
  props: {},
  async run() {
    const chain = await getChainStats();
    if (!chain) {
      return {
        found: false,
        message: 'Osmosis chain entry not found in DeFiLlama chains data.',
      };
    }
    return {
      found: true,
      name: chain.name,
      tvl: chain.tvl,
      tokenSymbol: chain.tokenSymbol,
      cmcId: chain.cmcId,
      gecko_id: chain.gecko_id,
      chainId: chain.chainId,
      raw: chain,
    };
  },
});
