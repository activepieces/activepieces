import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaRequest } from '../taiko-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get TVL Chain Breakdown',
  description: 'Fetch the TVL breakdown across all chains where Taiko is deployed, from DeFiLlama.',
  props: {},
  async run() {
    const data = await defiLlamaRequest<any>('/protocol/taiko');
    const chainTvls: Record<string, number> = {};
    if (data.currentChainTvls) {
      for (const [chain, tvl] of Object.entries(data.currentChainTvls)) {
        chainTvls[chain] = tvl as number;
      }
    }
    const sorted = Object.entries(chainTvls)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([chain, tvl]) => ({ chain, tvl }));
    return {
      totalChains: sorted.length,
      chains: sorted,
    };
  },
});
