import { createAction } from '@activepieces/pieces-framework';
import { debridgeRequest } from '../lib/debridge-api';

export const getBridgeStats = createAction({
  name: 'get_bridge_stats',
  displayName: 'Get Bridge Stats',
  description: 'Get deBridge TVL statistics and chain breakdown from DeFiLlama',
  props: {},
  async run() {
    const data = await debridgeRequest('/protocol/debridge');
    const chainTvls = data.chainTvls ?? {};
    const chains = Object.entries(chainTvls).map(([chain, info]: [string, any]) => ({
      chain,
      tvl: typeof info === 'object' ? info.tvl : info,
    }));
    chains.sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0));
    return {
      name: data.name,
      totalTvl: data.tvl,
      chainCount: chains.length,
      chains,
      currentChainTvls: data.currentChainTvls,
    };
  },
});
