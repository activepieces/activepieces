import { createAction } from '@activepieces/pieces-framework';
import { radiantRequest } from '../radiant-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description:
    'Get Radiant Capital TVL breakdown by individual chain from DeFiLlama.',
  props: {},
  async run() {
    const data = await radiantRequest('/protocol/radiant-v2');

    const chainTvls = data.chainTvls ?? {};
    const breakdown = Object.entries(chainTvls).map(
      ([chain, info]: [string, any]) => ({
        chain,
        tvl: Array.isArray(info?.tvl)
          ? info.tvl[info.tvl.length - 1]?.totalLiquidityUSD ?? null
          : info?.tvl ?? null,
      })
    );

    breakdown.sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0));

    return {
      chains: data.chains ?? [],
      breakdown,
      totalTvl: data.tvl,
    };
  },
});
