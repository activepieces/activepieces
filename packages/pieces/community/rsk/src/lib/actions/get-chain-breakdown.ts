import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch the TVL breakdown by chain for the Rootstock (RSK) protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      name: string;
      chains: string[];
      currentChainTvls: Record<string, number>;
      chainTvls: Record<string, {
        tvl: Array<{ date: number; totalLiquidityUSD: number }>;
        tokensInUsd?: Array<{ date: number; tokens: Record<string, number> }>;
        tokens?: Array<{ date: number; tokens: Record<string, number> }>;
      }>;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/rsk',
    });

    const data = response.body;

    const breakdown = Object.entries(data.currentChainTvls).map(([chain, tvl]) => ({
      chain,
      tvlUsd: tvl,
    }));

    breakdown.sort((a, b) => b.tvlUsd - a.tvlUsd);

    return {
      protocol: data.name,
      totalChains: data.chains.length,
      chains: data.chains,
      tvlByChain: breakdown,
      currentChainTvls: data.currentChainTvls,
    };
  },
});
