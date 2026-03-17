import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface ChainTvl {
  [chain: string]: number;
}

interface DefiLlamaProtocol {
  name: string;
  tvl: number;
  chainTvls: Record<string, { tvl: Array<{ date: number; totalLiquidityUSD: number }> }>;
  chains: string[];
}

export const getProtocolTvlAction = createAction({
  name: 'get-protocol-tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch current Total Value Locked (TVL) for Maple Finance from DeFiLlama',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<DefiLlamaProtocol>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/maple-finance',
    });

    const data = response.body;
    const chains = data.chains ?? Object.keys(data.chainTvls ?? {});

    return {
      name: data.name,
      tvl: data.tvl,
      chains,
    };
  },
});
