import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData } from '../lib/frax-api';

export const getChainTvl = createAction({
  name: 'get_chain_tvl',
  displayName: 'Get TVL by Chain',
  description: 'Get Frax Finance TVL breakdown across all supported blockchain networks',
  props: {},
  async run() {
    const data = await getProtocolData() as Record<string, unknown>;

    const currentChainTvls = data['currentChainTvls'] as Record<string, number> ?? {};
    const chainTvls = data['chainTvls'] as Record<string, { tvl: Array<{ date: number; totalLiquidityUSD: number }> }> ?? {};

    // Build sorted list of chains by TVL
    const chains = Object.entries(currentChainTvls)
      .map(([chain, tvl]) => ({ chain, tvl_usd: tvl }))
      .sort((a, b) => b.tvl_usd - a.tvl_usd);

    const totalTvl = chains.reduce((sum, c) => sum + c.tvl_usd, 0);

    // Get latest TVL per chain from history if available
    const chainDetails: Record<string, unknown> = {};
    for (const [chain, history] of Object.entries(chainTvls)) {
      if (history.tvl && Array.isArray(history.tvl) && history.tvl.length > 0) {
        const latest = history.tvl[history.tvl.length - 1];
        chainDetails[chain] = {
          current_tvl_usd: currentChainTvls[chain] ?? latest.totalLiquidityUSD,
          last_updated: new Date(latest.date * 1000).toISOString(),
        };
      }
    }

    return {
      total_tvl_usd: totalTvl,
      chain_count: chains.length,
      chains_ranked: chains,
      chain_details: chainDetails,
      fetched_at: new Date().toISOString(),
    };
  },
});
