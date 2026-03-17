import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key statistics for Zilliqa from DeFiLlama including TVL, chains count, and category.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      name: string;
      symbol: string;
      description: string;
      category: string;
      chains: string[];
      tvl: number;
      currentChainTvls: Record<string, number>;
      mcap: number;
      twitter: string;
      url: string;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/zilliqa',
    });

    const data = response.body;
    const chainCount = data.chains ? data.chains.length : 0;
    const topChain = data.currentChainTvls
      ? Object.entries(data.currentChainTvls).sort((a, b) => b[1] - a[1])[0]
      : null;

    return {
      name: data.name,
      symbol: data.symbol,
      description: data.description,
      category: data.category,
      tvl: data.tvl,
      chainCount,
      chains: data.chains,
      topChain: topChain ? { chain: topChain[0], tvl: topChain[1] } : null,
      mcap: data.mcap,
      twitter: data.twitter,
      url: data.url,
    };
  },
});
