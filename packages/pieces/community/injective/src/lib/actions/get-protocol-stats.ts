import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key statistics for the Injective protocol including TVL, chains, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/injective',
    });

    const data = response.body as Record<string, unknown>;
    const tvlArray = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
    const chainTvls = data['chainTvls'] as Record<string, unknown> | undefined;

    const currentTvl = tvlArray && tvlArray.length > 0
      ? tvlArray[tvlArray.length - 1].totalLiquidityUSD
      : null;

    const prev7d = tvlArray && tvlArray.length >= 7
      ? tvlArray[tvlArray.length - 7].totalLiquidityUSD
      : null;

    const change7d =
      currentTvl !== null && prev7d !== null && prev7d > 0
        ? Math.round(((currentTvl - prev7d) / prev7d) * 10000) / 100
        : null;

    const chains = chainTvls ? Object.keys(chainTvls) : [];

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      currentTvlUsd: currentTvl,
      change7dPercent: change7d,
      chains,
      chainCount: chains.length,
      geckoId: data['gecko_id'],
      description: data['description'],
      url: data['url'],
    };
  },
});
