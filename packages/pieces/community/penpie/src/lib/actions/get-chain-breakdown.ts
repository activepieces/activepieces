import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch Penpie TVL breakdown by blockchain network from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/penpie',
      headers: {
        Accept: 'application/json',
      },
    });

    const data = response.body as Record<string, unknown>;
    const chainTvls = data['chainTvls'] as Record<string, { tvl: Array<{ date: number; totalLiquidityUSD: number }> }> | undefined;

    if (!chainTvls) {
      return { chains: [] };
    }

    const breakdown = Object.entries(chainTvls).map(([chain, chainData]) => {
      const tvlHistory = chainData.tvl ?? [];
      const latest = tvlHistory.at(-1);
      return {
        chain,
        currentTvlUsd: latest?.totalLiquidityUSD ?? 0,
        lastUpdated: latest?.date ? new Date(latest.date * 1000).toISOString() : null,
      };
    });

    breakdown.sort((a, b) => b.currentTvlUsd - a.currentTvlUsd);

    return {
      chains: breakdown,
      totalChains: breakdown.length,
    };
  },
});
