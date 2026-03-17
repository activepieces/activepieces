import { createAction } from '@activepieces/pieces-framework';
import { fetchAnkrProtocol } from '../ankr-api';

interface ChainBreakdownEntry {
  chain: string;
  tvl: number;
  percentage: number;
}

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: "Retrieve Ankr's TVL broken down by blockchain, sorted by TVL descending with percentage of total.",
  auth: undefined,
  props: {},
  async run() {
    const protocol = await fetchAnkrProtocol();

    const currentChainTvls = protocol.currentChainTvls ?? {};
    const totalTvl = Object.values(currentChainTvls).reduce(
      (sum: number, val: number) => sum + val,
      0
    );

    const breakdown: ChainBreakdownEntry[] = Object.entries(currentChainTvls)
      .map(([chain, tvl]) => ({
        chain,
        tvl: tvl as number,
        percentage: totalTvl > 0 ? ((tvl as number) / totalTvl) * 100 : 0,
      }))
      .sort((a, b) => b.tvl - a.tvl);

    return {
      total_tvl: totalTvl,
      chain_count: breakdown.length,
      chains: breakdown.map((entry) => ({
        chain: entry.chain,
        tvl: entry.tvl,
        percentage: parseFloat(entry.percentage.toFixed(2)),
      })),
    };
  },
});
