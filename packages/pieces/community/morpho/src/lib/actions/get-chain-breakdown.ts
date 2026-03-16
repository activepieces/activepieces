import { createAction } from '@activepieces/pieces-framework';
import { morphoRequest } from '../morpho-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get Morpho TVL breakdown by chain (Ethereum, Base, etc.) from DeFiLlama.',
  props: {},
  async run() {
    const data = await morphoRequest('/protocol/morpho');

    const chainTvls: Record<string, number> = {};
    if (data.chainTvls) {
      for (const [chain, info] of Object.entries(data.chainTvls as Record<string, any>)) {
        chainTvls[chain] = typeof info === 'object' && info !== null ? info.tvl ?? 0 : info;
      }
    }

    const chains: string[] = data.chains ?? Object.keys(chainTvls);

    return {
      totalTvl: data.tvl,
      chains,
      chainTvls,
    };
  },
});
