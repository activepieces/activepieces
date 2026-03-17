import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key protocol statistics for Larix from DeFiLlama including TVL, supported chains, and category.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/larix',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number>;
    const chains = data['chains'] as string[];

    const totalTvl = currentChainTvls
      ? Object.values(currentChainTvls).reduce((sum, v) => sum + (v ?? 0), 0)
      : 0;

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      description: data['description'],
      total_tvl_usd: totalTvl,
      chains: chains ?? [],
      chain_count: chains?.length ?? 0,
      url: data['url'],
      twitter: data['twitter'],
      gecko_id: data['gecko_id'],
    };
  },
});
