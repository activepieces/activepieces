import { createAction } from '@activepieces/pieces-framework';
import { fetchDefiLlamaProtocol, ChainTvlEntry } from '../stakewise-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch TVL broken down by blockchain from DeFiLlama, sorted by TVL descending with percentage of total.',
  auth: undefined,
  props: {},
  async run() {
    const protocol = await fetchDefiLlamaProtocol();
    const chainTvls = protocol.currentChainTvls ?? protocol.chainTvls ?? {};

    // Filter out staking/pool2 pseudo-chains and compute real TVL entries
    const excluded = new Set(['staking', 'pool2', 'borrowed']);
    const entries: ChainTvlEntry[] = Object.entries(chainTvls)
      .filter(([chain]) => !excluded.has(chain.toLowerCase()))
      .map(([chain, tvl]) => ({ chain, tvl, percentage: 0 }));

    const totalTvl = entries.reduce((sum, e) => sum + e.tvl, 0);

    const sorted = entries
      .map((e) => ({
        ...e,
        percentage: totalTvl > 0 ? parseFloat(((e.tvl / totalTvl) * 100).toFixed(2)) : 0,
        tvlFormatted: `$${e.tvl.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
      }))
      .sort((a, b) => b.tvl - a.tvl);

    return {
      totalTvl,
      totalTvlFormatted: `$${totalTvl.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
      chainCount: sorted.length,
      chains: sorted,
    };
  },
});
