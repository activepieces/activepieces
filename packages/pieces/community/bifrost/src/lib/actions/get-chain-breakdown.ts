import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch the TVL breakdown by blockchain for Bifrost Finance from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/bifrost-finance',
    });

    const data = response.body as Record<string, unknown>;
    const chainTvls = (data['chainTvls'] ?? {}) as Record<string, unknown>;

    const chains: Array<{ chain: string; tvl: number }> = [];

    for (const [chain, chainData] of Object.entries(chainTvls)) {
      const cd = chainData as Record<string, unknown>;
      const tvlArr = cd['tvl'] as Array<Record<string, number>> | undefined;
      if (tvlArr && tvlArr.length > 0) {
        const latest = tvlArr[tvlArr.length - 1];
        chains.push({ chain, tvl: latest['totalLiquidityUSD'] ?? 0 });
      }
    }

    chains.sort((a, b) => b.tvl - a.tvl);

    return {
      protocol: data['name'],
      chains,
      total_chains: chains.length,
    };
  },
});
