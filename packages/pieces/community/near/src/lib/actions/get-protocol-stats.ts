import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key NEAR Protocol statistics including TVL, chains, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      name: string;
      symbol: string;
      url: string;
      description: string;
      category: string;
      chains: string[];
      currentChainTvls: Record<string, number>;
      twitter: string;
      gecko_id: string;
      cmcId: string;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/near',
    });
    const data = response.body;
    const totalTvl = Object.values(data.currentChainTvls).reduce((sum, val) => sum + val, 0);
    return {
      name: data.name,
      symbol: data.symbol,
      category: data.category,
      description: data.description,
      url: data.url,
      twitter: data.twitter,
      geckoId: data.gecko_id,
      cmcId: data.cmcId,
      totalTvlUsd: totalTvl,
      numberOfChains: data.chains.length,
      chains: data.chains,
      currentChainTvls: data.currentChainTvls,
    };
  },
});
