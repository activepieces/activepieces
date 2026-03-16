import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get the TVL breakdown of Connext protocol across all supported EVM chains from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/connext',
    });
    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chains = data['chains'] as string[] | undefined;
    if (!currentChainTvls) {
      return { chains: [], breakdown: {} };
    }
    const breakdown = Object.entries(currentChainTvls).map(([chain, tvl]) => ({
      chain,
      tvl_usd: tvl,
    })).sort((a, b) => b.tvl_usd - a.tvl_usd);
    return {
      chains: chains ?? [],
      total_chains: breakdown.length,
      breakdown,
    };
  },
});
