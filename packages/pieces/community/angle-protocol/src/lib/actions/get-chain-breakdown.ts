import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DEFILLAMA_ANGLE_URL } from '../angle-api';

export const getChainBreakdown = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Get Angle Protocol TVL broken down by chain, sorted by TVL descending',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: DEFILLAMA_ANGLE_URL,
    });
    const data = response.body;
    const chainTvls: Record<string, { tvl: { date: number; totalLiquidityUSD: number }[] }> =
      data.chainTvls ?? {};

    const breakdown = Object.entries(chainTvls).map(([chain, chainData]) => {
      const latest = chainData.tvl?.[chainData.tvl.length - 1];
      return {
        chain,
        tvl: latest?.totalLiquidityUSD ?? 0,
      };
    });

    breakdown.sort((a, b) => b.tvl - a.tvl);

    return { chains: breakdown };
  },
});
