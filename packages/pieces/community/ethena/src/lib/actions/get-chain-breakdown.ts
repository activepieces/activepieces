import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData } from '../ethena-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Fetch the TVL distribution across all chains for the Ethena protocol.',
  props: {},
  async run() {
    const data = await getProtocolData();
    const chainTvls = data.chainTvls || {};

    const chains = Object.entries(chainTvls)
      .map(([chain, tvl]) => ({
        chain,
        tvl,
        tvl_formatted: `$${Number(tvl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        percentage: data.tvl > 0 ? ((tvl / data.tvl) * 100).toFixed(2) + '%' : '0%',
      }))
      .sort((a, b) => b.tvl - a.tvl);

    return {
      total_tvl: data.tvl,
      total_tvl_formatted: `$${Number(data.tvl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      chain_count: chains.length,
      chains,
    };
  },
});
