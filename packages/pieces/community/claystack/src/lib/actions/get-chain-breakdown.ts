import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocol } from '../claystack-api';

export const getChainBreakdown = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Fetch TVL distribution across chains for ClayStack, sorted by size descending with percentage of total.',
  auth: undefined,
  props: {},
  async run() {
    const protocol = await fetchProtocol();
    const chainTvls = protocol.currentChainTvls;

    const totalTvl = Object.values(chainTvls).reduce((sum, v) => sum + v, 0);

    const chains = Object.entries(chainTvls)
      .map(([chain, tvl]) => ({
        chain,
        tvl_usd: tvl,
        tvl_formatted: `$${tvl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        percentage_of_total: totalTvl > 0 ? parseFloat(((tvl / totalTvl) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.tvl_usd - a.tvl_usd);

    return {
      protocol: protocol.name,
      total_tvl_usd: totalTvl,
      total_tvl_formatted: `$${totalTvl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      chain_count: chains.length,
      chains,
      source: 'DeFiLlama',
    };
  },
});
