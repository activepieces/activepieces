import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key stats for LayerZero including TVL, supported chains, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/layerzero',
    });
    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chains = data['chains'] as string[] | undefined;
    const tvlArray = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    const latestTvl = tvlArray && tvlArray.length > 0
      ? tvlArray[tvlArray.length - 1].totalLiquidityUSD
      : null;

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      description: data['description'],
      chains: chains ?? [],
      chainCount: chains?.length ?? 0,
      currentTvlUsd: latestTvl,
      currentChainTvls: currentChainTvls ?? {},
      twitter: data['twitter'],
      url: data['url'],
    };
  },
});
