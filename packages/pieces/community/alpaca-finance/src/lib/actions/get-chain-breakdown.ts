import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch TVL breakdown by blockchain for Alpaca Finance from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/alpaca-finance',
    });
    const data = response.body as Record<string, unknown>;
    const currentChainTvls = (data['currentChainTvls'] as Record<string, number>) || {};
    const chainTvlsHistory = data['chainTvls'] as Record<string, unknown> | undefined;

    const chains = Object.entries(currentChainTvls).map(([chain, tvl]) => ({
      chain,
      current_tvl_usd: tvl,
    }));

    chains.sort((a, b) => b.current_tvl_usd - a.current_tvl_usd);

    return {
      chains,
      total_chains: chains.length,
      dominant_chain: chains[0]?.chain ?? null,
      chain_history_available: chainTvlsHistory ? Object.keys(chainTvlsHistory) : [],
    };
  },
});
