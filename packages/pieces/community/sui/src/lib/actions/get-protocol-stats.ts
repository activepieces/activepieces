import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetch key statistics for the Sui Network protocol via DeFiLlama — TVL, chains, category, and more.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/sui',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;

    const chainCount = currentChainTvls ? Object.keys(currentChainTvls).length : 0;
    const chains = currentChainTvls ? Object.keys(currentChainTvls) : [];

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      chain: data['chain'],
      chains,
      chain_count: chainCount,
      tvl: data['tvl'],
      current_chain_tvls: data['currentChainTvls'],
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
      slug: data['slug'],
    };
  },
});
