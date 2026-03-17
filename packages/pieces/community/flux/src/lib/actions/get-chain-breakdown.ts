import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface ChainTvlEntry {
  date: number;
  totalLiquidityUSD: number;
}

interface ProtocolResponse {
  chainTvls?: Record<string, { tvl: ChainTvlEntry[] }>;
  currentChainTvls?: Record<string, number>;
}

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch the TVL breakdown by chain for the Flux protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<ProtocolResponse>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/flux',
    });
    const data = response.body;
    const currentChainTvls = data.currentChainTvls ?? {};
    const chainBreakdown = Object.entries(currentChainTvls).map(([chain, tvl]) => ({
      chain,
      tvlUsd: tvl,
    }));
    return {
      protocol: 'flux',
      chainBreakdown,
      source: 'DeFiLlama',
    };
  },
});
