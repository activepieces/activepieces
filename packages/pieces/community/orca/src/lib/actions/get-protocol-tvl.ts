import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'getProtocolTvl',
  displayName: 'Get Protocol TVL',
  description:
    'Fetch the current Total Value Locked (TVL) for Orca DEX from DeFiLlama.',
  props: {},
  auth: undefined,
  async run() {
    const response = await httpClient.sendRequest<{
      tvl: number;
      name: string;
      symbol: string;
      chains: string[];
      currentChainTvls: Record<string, number>;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/orca',
    });

    const data = response.body;
    const tvlArray = (data as Record<string, unknown>)['tvl'] as Array<{
      date: number;
      totalLiquidityUSD: number;
    }>;
    const latestTvl =
      tvlArray && tvlArray.length > 0
        ? tvlArray[tvlArray.length - 1].totalLiquidityUSD
        : 0;

    return {
      name: (data as Record<string, unknown>)['name'],
      symbol: (data as Record<string, unknown>)['symbol'],
      currentTvlUSD: latestTvl,
      chains: (data as Record<string, unknown>)['chains'],
      currentChainTvls: (data as Record<string, unknown>)['currentChainTvls'],
    };
  },
});
