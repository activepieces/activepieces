import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current Total Value Locked (TVL) for Kamino Finance from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      currentChainTvls: Record<string, number>;
      tvl: Array<{ date: number; totalLiquidityUSD: number }>;
      name: string;
      symbol: string;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/kamino',
    });

    const data = response.body;
    const latestTvl =
      data.tvl && data.tvl.length > 0
        ? data.tvl[data.tvl.length - 1].totalLiquidityUSD
        : null;

    return {
      name: data.name,
      symbol: data.symbol,
      currentTvlUSD: latestTvl,
      chainBreakdown: data.currentChainTvls,
    };
  },
});
