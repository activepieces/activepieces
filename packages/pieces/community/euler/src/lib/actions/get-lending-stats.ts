import { createAction } from '@activepieces/pieces-framework';
import { eulerRequest } from '../euler-api';

export const getLendingStats = createAction({
  name: 'get_lending_stats',
  displayName: 'Get Lending Stats',
  description: 'Get Euler Finance borrowed vs supplied TVL and compute utilization rate',
  auth: undefined,
  props: {},
  async run() {
    const data = await eulerRequest('https://api.llama.fi/protocol/euler');
    const chainTvls = data.chainTvls as Record<string, { tvl: { totalLiquidityUSD: number }[]; borrowedTvl: { totalLiquidityUSD: number }[] }>;
    const currentChainTvls = data.currentChainTvls as Record<string, number>;

    let totalSupplied = 0;
    let totalBorrowed = 0;

    for (const [, chainData] of Object.entries(chainTvls)) {
      const supplied = chainData.tvl?.[chainData.tvl.length - 1]?.totalLiquidityUSD ?? 0;
      const borrowed = chainData.borrowedTvl?.[chainData.borrowedTvl.length - 1]?.totalLiquidityUSD ?? 0;
      totalSupplied += supplied;
      totalBorrowed += borrowed;
    }

    const utilizationRate = totalSupplied > 0 ? (totalBorrowed / totalSupplied) * 100 : 0;

    return {
      totalSupplied,
      totalBorrowed,
      utilizationRate: parseFloat(utilizationRate.toFixed(2)),
      currentChainTvls,
    };
  },
});
