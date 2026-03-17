import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface ChainTvl {
  tvl: number;
}

interface ProtocolResponse {
  name: string;
  symbol: string;
  description: string;
  chains: string[];
  tvl: { date: number; totalLiquidityUSD: number }[];
  chainTvls: Record<string, ChainTvl>;
}

export const getProtocolTvl = createAction({
  name: 'get-protocol-tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current total value locked (TVL) for Goldfinch Finance from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<ProtocolResponse>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/goldfinch',
    });

    const data = response.body;
    const tvlHistory = data.tvl ?? [];
    const currentTvl =
      tvlHistory.length > 0
        ? tvlHistory[tvlHistory.length - 1].totalLiquidityUSD
        : 0;

    return {
      name: data.name,
      symbol: data.symbol,
      description: data.description,
      tvl: currentTvl,
      chains: data.chains,
    };
  },
});
