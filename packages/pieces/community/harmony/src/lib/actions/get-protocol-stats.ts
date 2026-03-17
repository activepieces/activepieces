import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

interface ProtocolData {
  name?: string;
  symbol?: string;
  description?: string;
  category?: string;
  tvl?: number;
  currentChainTvls?: Record<string, number>;
  chains?: string[];
  url?: string;
  twitter?: string;
  gecko_id?: string;
  cmcId?: string;
}

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key stats for the Harmony (ONE) protocol including TVL, chains, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<ProtocolData>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/harmony',
    });

    const data = response.body;
    const chains = data.chains ?? Object.keys(data.currentChainTvls ?? {});

    return {
      name: data.name,
      symbol: data.symbol,
      description: data.description,
      category: data.category,
      tvlUSD: data.tvl,
      chains: chains,
      chainCount: chains.length,
      url: data.url,
      twitter: data.twitter,
      geckoId: data.gecko_id,
      cmcId: data.cmcId,
    };
  },
});
