import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData } from '../../sushiswap-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get SushiSwap TVL broken down by chain, sorted descending by TVL.',
  props: {},
  async run() {
    const data = await getProtocolData();
    const chainTvls: Record<string, { tvl: number }> = data.chainTvls ?? {};

    const breakdown = Object.entries(chainTvls)
      .map(([chain, info]) => ({
        chain,
        tvl: typeof info === 'object' && info !== null ? (info as { tvl: number }).tvl : (info as unknown as number),
      }))
      .sort((a, b) => b.tvl - a.tvl);

    return { chains: breakdown };
  },
});
