import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaRequest } from '../fantom-api';

interface FantomProtocolData {
  chainTvls: Record<string, number>;
  chains: string[];
  tvl: number;
}

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch the TVL breakdown by blockchain for the Fantom ecosystem from DeFiLlama.',
  props: {},
  async run() {
    const data = await defiLlamaRequest<FantomProtocolData>('/protocol/fantom');

    const chainTvls = data.chainTvls || {};
    const totalTvl = data.tvl || 0;

    const breakdown = Object.entries(chainTvls)
      .map(([chain, tvl]) => ({
        chain,
        tvl,
        percentage: totalTvl > 0 ? parseFloat(((tvl / totalTvl) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.tvl - a.tvl);

    return {
      total_tvl: totalTvl,
      chains: data.chains,
      breakdown,
    };
  },
});
