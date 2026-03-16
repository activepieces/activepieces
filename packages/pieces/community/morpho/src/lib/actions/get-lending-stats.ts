import { createAction } from '@activepieces/pieces-framework';
import { morphoRequest } from '../morpho-api';

export const getLendingStats = createAction({
  name: 'get_lending_stats',
  displayName: 'Get Lending Stats',
  description: 'Get total borrowed vs supplied stats across Morpho markets from DeFiLlama.',
  props: {},
  async run() {
    const data = await morphoRequest('/protocol/morpho');

    // DeFiLlama reports borrowed and supplied in chainTvls categories
    const chainTvls = data.chainTvls ?? {};
    let totalBorrowed = 0;
    let totalSupplied = 0;

    for (const info of Object.values(chainTvls) as any[]) {
      if (typeof info === 'object' && info !== null) {
        totalBorrowed += info.borrowed ?? 0;
        totalSupplied += info.supplied ?? 0;
      }
    }

    // Fallback: use top-level borrowed/supplied if present
    if (totalBorrowed === 0 && data.borrowed != null) totalBorrowed = data.borrowed;
    if (totalSupplied === 0 && data.supplied != null) totalSupplied = data.supplied;

    return {
      totalTvl: data.tvl,
      totalBorrowed,
      totalSupplied,
      utilizationRate:
        totalSupplied > 0
          ? parseFloat(((totalBorrowed / totalSupplied) * 100).toFixed(2))
          : null,
    };
  },
});
