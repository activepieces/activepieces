import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface DefiLlamaProtocol {
  name: string;
  tvl: number;
  chainTvls: Record<string, number>;
  chains: string[];
  category: string;
  symbol: string;
  description: string;
  url: string;
  twitter: string;
  currentChainTvls: Record<string, number>;
}

export const getProtocolTvl = createAction({
  name: 'get-protocol-tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch current Total Value Locked (TVL) for Parallel Finance from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<DefiLlamaProtocol>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/parallel',
    });

    const data = response.body;

    return {
      name: data.name,
      tvl: data.tvl,
      tvlFormatted: `$${(data.tvl / 1_000_000).toFixed(2)}M`,
      symbol: data.symbol,
      category: data.category,
      chains: data.chains,
      chainCount: data.chains?.length ?? 0,
      description: data.description,
      url: data.url,
      twitter: data.twitter,
    };
  },
});
