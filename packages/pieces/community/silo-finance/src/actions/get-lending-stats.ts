import { createAction } from '@activepieces/pieces-framework';
import { siloRequest } from '../lib/silo-api';

export const getLendingStats = createAction({
  name: 'get_lending_stats',
  displayName: 'Get Lending Stats',
  description:
    'Get Silo Finance total borrowed vs supplied statistics across all isolated markets from DeFiLlama.',
  props: {},
  async run() {
    const data = await siloRequest('/protocol/silo-finance');

    // DeFiLlama surfaces borrowed/supplied under currentChainTvls or
    // as top-level keys depending on the adapter version.
    const chainTvls = data.chainTvls ?? {};

    let totalBorrowed = 0;
    let totalSupplied = 0;

    for (const [, info] of Object.entries(chainTvls) as [string, any][]) {
      if (typeof info === 'object' && info !== null) {
        if (typeof info.borrowed === 'number') totalBorrowed += info.borrowed;
        if (typeof info.tvl === 'number') totalSupplied += info.tvl;
      }
    }

    // Fallback: use top-level tvl if chain breakdown doesn't have per-chain supplied
    if (totalSupplied === 0 && typeof data.tvl === 'number') {
      totalSupplied = data.tvl;
    }

    const utilizationRate =
      totalSupplied > 0 ? ((totalBorrowed / totalSupplied) * 100).toFixed(2) + '%' : 'N/A';

    return {
      totalSuppliedUsd: totalSupplied,
      totalBorrowedUsd: totalBorrowed,
      utilizationRate,
      chains: Object.keys(chainTvls),
    };
  },
});
