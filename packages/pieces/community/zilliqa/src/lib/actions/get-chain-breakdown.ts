import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch the TVL breakdown by individual chain for the Zilliqa protocol from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      name: string;
      currentChainTvls: Record<string, number>;
      chainTvls: Record<string, {
        tvl: Array<{ date: number; totalLiquidityUSD: number }>;
        tokensInUsd: Array<{ date: number; tokens: Record<string, number> }>;
        tokens: Array<{ date: number; tokens: Record<string, number> }>;
      }>;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/zilliqa',
    });

    const data = response.body;
    const chains = Object.entries(data.currentChainTvls).map(([chain, tvl]) => ({
      chain,
      tvl,
    }));

    chains.sort((a, b) => b.tvl - a.tvl);

    return {
      protocol: data.name,
      totalChains: chains.length,
      chains,
    };
  },
});
