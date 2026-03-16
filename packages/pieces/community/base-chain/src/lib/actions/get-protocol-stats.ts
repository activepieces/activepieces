import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Retrieve key protocol statistics for Base from DeFiLlama, including TVL, chains, and category.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/base',
    });

    const data = response.body as Record<string, unknown>;
    const tvlArray = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
    const currentTvl = tvlArray && tvlArray.length > 0
      ? tvlArray[tvlArray.length - 1].totalLiquidityUSD
      : null;

    const previousTvl = tvlArray && tvlArray.length > 1
      ? tvlArray[tvlArray.length - 2].totalLiquidityUSD
      : null;

    const tvlChange24h = currentTvl !== null && previousTvl !== null && previousTvl !== 0
      ? ((currentTvl - previousTvl) / previousTvl) * 100
      : null;

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      chains: data['chains'],
      currentTvl_usd: currentTvl,
      tvlChange24h_pct: tvlChange24h !== null ? Math.round(tvlChange24h * 100) / 100 : null,
      url: data['url'],
      twitter: data['twitter'],
      description: data['description'],
      audit_links: data['audit_links'],
    };
  },
});
