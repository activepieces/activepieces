import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaRequest } from '../scroll-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description:
    'Fetch the TVL breakdown by chain for the Scroll protocol, showing how liquidity is distributed across all supported chains.',
  props: {},
  async run() {
    const data = await defiLlamaRequest<Record<string, unknown>>('/protocol/scroll');

    const currentChainTvls: Record<string, number> =
      (data as any)?.currentChainTvls ?? {};

    const chains = Object.entries(currentChainTvls)
      .map(([chain, tvl]) => ({ chain, tvl }))
      .sort((a, b) => (b.tvl as number) - (a.tvl as number));

    const totalTvl = chains.reduce((sum, c) => sum + (c.tvl as number), 0);

    return {
      protocol: 'Scroll',
      totalTvl,
      chainCount: chains.length,
      breakdown: chains,
    };
  },
});
