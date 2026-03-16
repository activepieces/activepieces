import { createAction } from '@activepieces/pieces-framework';
import { radiantRequest } from '../radiant-api';

export const getLendingStats = createAction({
  name: 'get_lending_stats',
  displayName: 'Get Lending Stats',
  description:
    'Get Radiant Capital lending statistics including total borrowed and total supplied across the protocol from DeFiLlama.',
  props: {},
  async run() {
    const data = await radiantRequest('/protocol/radiant-v2');

    const chainTvls = data.chainTvls ?? {};
    let totalBorrowed = 0;
    let totalSupplied = 0;

    for (const [, info] of Object.entries(chainTvls) as [string, any][]) {
      if (info?.borrowed) {
        const borrowed = Array.isArray(info.borrowed)
          ? info.borrowed[info.borrowed.length - 1]?.totalLiquidityUSD ?? 0
          : info.borrowed ?? 0;
        totalBorrowed += borrowed;
      }
      if (info?.tvl) {
        const supplied = Array.isArray(info.tvl)
          ? info.tvl[info.tvl.length - 1]?.totalLiquidityUSD ?? 0
          : info.tvl ?? 0;
        totalSupplied += supplied;
      }
    }

    return {
      totalSuppliedUsd: totalSupplied,
      totalBorrowedUsd: totalBorrowed,
      utilizationRate:
        totalSupplied > 0
          ? parseFloat(((totalBorrowed / totalSupplied) * 100).toFixed(2))
          : null,
      chains: data.chains ?? [],
    };
  },
});
