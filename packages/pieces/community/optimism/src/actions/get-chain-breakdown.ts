import { createAction } from '@activepieces/pieces-framework';
import { fetchUrl } from '../lib/optimism-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get TVL breakdown by chain for Optimism protocol from DeFiLlama',
  auth: undefined,
  props: {},
  async run(_context) {
    const data = await fetchUrl('https://api.llama.fi/protocol/optimism');

    const currentChainTvls = (data['currentChainTvls'] as Record<string, number>) ?? {};

    const breakdown = Object.entries(currentChainTvls)
      .map(([chain, tvl]) => ({ chain, tvlUsd: tvl }))
      .sort((a, b) => b.tvlUsd - a.tvlUsd);

    const totalTvl = breakdown.reduce((sum, entry) => sum + entry.tvlUsd, 0);

    return {
      protocol: 'Optimism',
      totalTvlUsd: totalTvl,
      chainCount: breakdown.length,
      breakdown,
      source: 'DeFiLlama',
    };
  },
});
