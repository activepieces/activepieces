import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current Total Value Locked (TVL) for Solend from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      tvl: number;
      name: string;
      symbol: string;
      chain: string;
      currentChainTvls: Record<string, number>;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/solend',
    });

    const data = response.body;
    const tvlArray = (data as any).tvl as Array<{ date: number; totalLiquidityUSD: number }>;
    const latestTvl = tvlArray && tvlArray.length > 0 ? tvlArray[tvlArray.length - 1] : null;

    return {
      name: (data as any).name,
      symbol: (data as any).symbol,
      chain: (data as any).chain,
      category: (data as any).category,
      currentTvlUSD: latestTvl ? latestTvl.totalLiquidityUSD : null,
      currentChainTvls: (data as any).currentChainTvls,
    };
  },
});
