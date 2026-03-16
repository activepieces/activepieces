import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData } from '../../perp-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Get TVL breakdown by chain for Perp Protocol, sorted descending by TVL.',
  props: {},
  async run() {
    const data = await getProtocolData();
    const chainTvls: Record<string, number> = data.currentChainTvls ?? {};

    const sorted = Object.entries(chainTvls)
      .map(([chain, tvl]) => ({ chain, tvl: tvl as number }))
      .sort((a, b) => b.tvl - a.tvl);

    return { chains: sorted };
  },
});
