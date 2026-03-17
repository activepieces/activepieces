import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocolTvl } from '../meta-pool-api';

export const getChainBreakdown = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Get the TVL breakdown by blockchain for Meta Pool, sorted by TVL descending with percentage of total.',
  props: {},
  async run() {
    const data = await fetchProtocolTvl();

    const chainTvls = data.currentChainTvls ?? {};
    const totalTvl = Object.values(chainTvls).reduce((a, b) => a + b, 0);

    const chains = Object.entries(chainTvls)
      .map(([chain, tvl]) => ({
        chain,
        tvl_usd: tvl,
        tvl_formatted: `$${tvl.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
        pct_of_total: totalTvl > 0 ? parseFloat(((tvl / totalTvl) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.tvl_usd - a.tvl_usd);

    return {
      protocol: data.name,
      total_tvl_usd: totalTvl,
      total_tvl_formatted: `$${totalTvl.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      chain_count: chains.length,
      chains,
      fetched_at: new Date().toISOString(),
    };
  },
});
