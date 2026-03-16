import { createAction } from '@activepieces/pieces-framework';
import { fetchDefiLlama } from '../common/dodo-api';

export const getChainBreakdown = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get DODO TVL distribution across all supported chains from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const data = await fetchDefiLlama();

    const chains: Array<{ chain: string; tvl: number }> = [];

    if (data.chainTvls) {
      for (const [chain, chainData] of Object.entries(data.chainTvls as Record<string, any>)) {
        const tvlArr = chainData.tvl;
        if (Array.isArray(tvlArr) && tvlArr.length > 0) {
          chains.push({
            chain,
            tvl: tvlArr[tvlArr.length - 1].totalLiquidityUSD,
          });
        }
      }
    }

    chains.sort((a, b) => b.tvl - a.tvl);

    return {
      chains,
      totalChains: chains.length,
    };
  },
});