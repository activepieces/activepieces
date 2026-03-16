import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch TVL breakdown by chain for the Celo protocol from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/celo',
    });

    const data = response.body as Record<string, unknown>;
    const chainTvls = (data['chainTvls'] as Record<string, unknown>) ?? {};

    const breakdown = Object.entries(chainTvls).map(([chain, tvlData]) => {
      const tvl = tvlData as Record<string, unknown>;
      const tvlArray = tvl['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
      const latestTvl = tvlArray && tvlArray.length > 0 ? tvlArray[tvlArray.length - 1] : null;
      return {
        chain,
        current_tvl_usd: latestTvl ? latestTvl.totalLiquidityUSD : null,
        last_updated: latestTvl ? new Date(latestTvl.date * 1000).toISOString() : null,
      };
    });

    return {
      protocol: data['name'],
      total_chains: breakdown.length,
      chain_breakdown: breakdown,
    };
  },
});
