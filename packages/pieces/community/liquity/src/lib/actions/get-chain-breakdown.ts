import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaRequest } from '../liquity-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Get the TVL breakdown for Liquity across all supported chains via DeFiLlama',
  props: {},
  async run() {
    const data = await defiLlamaRequest<any>('/protocol/liquity');
    const currentChainTvls = data.currentChainTvls ?? {};
    const chains = Object.entries(currentChainTvls).map(([chain, tvl]) => ({
      chain,
      tvlUSD: tvl as number,
    }));
    chains.sort((a, b) => b.tvlUSD - a.tvlUSD);
    const totalTvl = chains.reduce((sum, c) => sum + c.tvlUSD, 0);
    return {
      protocol: data.name,
      totalTvlUSD: totalTvl,
      chainCount: chains.length,
      chains,
      lastUpdated: new Date().toISOString(),
    };
  },
});
