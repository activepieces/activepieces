import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key protocol statistics for Internet Computer Protocol including TVL, chains, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/internet-computer',
    });

    const data = response.body;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> ?? {};
    const tvlValues = Object.values(currentChainTvls);
    const totalTvl = tvlValues.reduce((sum, val) => sum + val, 0);

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      chains: data['chains'],
      chainCount: Array.isArray(data['chains']) ? (data['chains'] as unknown[]).length : 0,
      totalTvl,
      currentChainTvls,
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
      gecko_id: data['gecko_id'],
      cmcId: data['cmcId'],
    };
  },
});
