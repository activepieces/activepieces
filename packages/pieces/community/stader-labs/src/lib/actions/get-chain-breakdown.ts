import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocolData, formatUsd, ChainBreakdownEntry } from '../stader-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description:
    'Fetch Stader Labs TVL broken down by chain, sorted by size with percentage of total.',
  auth: undefined,
  props: {},
  async run() {
    const data = await fetchProtocolData();

    const chainTvls = data.currentChainTvls ?? {};
    const total = Object.values(chainTvls).reduce((sum, v) => sum + v, 0);

    const breakdown: ChainBreakdownEntry[] = Object.entries(chainTvls)
      .map(([chain, tvlUsd]) => ({
        chain,
        tvlUsd,
        percentage: total > 0 ? Number(((tvlUsd / total) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.tvlUsd - a.tvlUsd);

    return {
      totalTvlUsd: total,
      totalTvlFormatted: formatUsd(total),
      chainCount: breakdown.length,
      chains: breakdown.map((entry) => ({
        ...entry,
        tvlFormatted: formatUsd(entry.tvlUsd),
      })),
    };
  },
});
