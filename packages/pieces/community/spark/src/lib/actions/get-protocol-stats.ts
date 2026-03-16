import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description: 'Get key statistics for Spark Protocol including TVL, supported chains, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/spark',
      headers: {
        Accept: 'application/json',
      },
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chains = data['chains'] as string[] | undefined;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    const totalTvl = Object.values(currentChainTvls ?? {}).reduce((acc, v) => acc + v, 0);
    const latestTvl = tvlHistory && tvlHistory.length > 0
      ? tvlHistory[tvlHistory.length - 1].totalLiquidityUSD
      : null;

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
      chain: data['chain'],
      chains: chains ?? [],
      total_chains: chains?.length ?? 0,
      current_tvl_usd: totalTvl,
      latest_tvl_usd: latestTvl,
      chain_breakdown: currentChainTvls ?? {},
    };
  },
});
