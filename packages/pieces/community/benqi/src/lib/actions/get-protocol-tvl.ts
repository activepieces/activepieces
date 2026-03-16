import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current Total Value Locked (TVL) for the Benqi protocol via DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      currentChainTvls: Record<string, number>;
      tvl: Array<{ date: number; totalLiquidityUSD: number }>;
      name: string;
      symbol: string;
      url: string;
      description: string;
      chains: string[];
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/benqi',
      headers: { 'Accept': 'application/json' },
    });

    const data = response.body;
    const latestTvl =
      data.tvl && data.tvl.length > 0
        ? data.tvl[data.tvl.length - 1].totalLiquidityUSD
        : null;

    return {
      name: data.name,
      symbol: data.symbol,
      url: data.url,
      description: data.description,
      chains: data.chains,
      currentChainTvls: data.currentChainTvls,
      latestTvlUSD: latestTvl,
    };
  },
});
