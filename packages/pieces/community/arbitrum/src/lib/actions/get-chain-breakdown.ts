import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdownAction = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch TVL breakdown by chain for Arbitrum from DeFiLlama, sorted by TVL descending.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/arbitrum',
    });

    const data = response.body as Record<string, unknown>;
    const chainTvls = data['chainTvls'] as Record<string, { tvl: Array<{ date: number; totalLiquidityUSD: number }> }> | undefined;

    if (!chainTvls) {
      return { chains: [], total_chains: 0 };
    }

    const chains = Object.entries(chainTvls)
      .map(([chainName, chainData]) => {
        const tvlArr = chainData.tvl;
        const latestEntry = tvlArr && tvlArr.length > 0 ? tvlArr[tvlArr.length - 1] : null;
        return {
          chain: chainName,
          tvl_usd: latestEntry ? latestEntry.totalLiquidityUSD : 0,
          last_updated: latestEntry
            ? new Date(latestEntry.date * 1000).toISOString().split('T')[0]
            : null,
        };
      })
      .filter(c => c.tvl_usd > 0)
      .sort((a, b) => b.tvl_usd - a.tvl_usd);

    return {
      chains,
      total_chains: chains.length,
    };
  },
});
