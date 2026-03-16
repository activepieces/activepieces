import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Retrieve the TVL breakdown by chain for Exactly Protocol from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      chainTvls?: Record<string, { tvl: Array<{ date: number; totalLiquidityUSD: number }> }>;
      currentChainTvls?: Record<string, number>;
      chains?: string[];
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/exactly',
    });

    const data = response.body;
    const currentChainTvls = data.currentChainTvls ?? {};
    const chains = data.chains ?? [];

    const breakdown = chains.map((chain) => ({
      chain,
      tvl: currentChainTvls[chain] ?? 0,
    }));

    breakdown.sort((a, b) => b.tvl - a.tvl);

    return {
      totalChains: chains.length,
      breakdown,
      currentChainTvls,
    };
  },
});
