import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description: 'Get key protocol statistics for Kusama from DeFiLlama including TVL, chains, and category.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/kusama',
    });

    const data = response.body as Record<string, unknown>;
    const tvlArr = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    let tvl24hChange: number | null = null;
    if (tvlArr && tvlArr.length >= 2) {
      const latest = tvlArr[tvlArr.length - 1].totalLiquidityUSD;
      const yesterday = tvlArr[tvlArr.length - 2].totalLiquidityUSD;
      if (yesterday !== 0) {
        tvl24hChange = ((latest - yesterday) / yesterday) * 100;
      }
    }

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      chains: data['chains'],
      total_chains: Array.isArray(data['chains']) ? (data['chains'] as string[]).length : 0,
      current_tvl_usd: data['tvl'],
      tvl_24h_change_percent: tvl24hChange !== null ? parseFloat(tvl24hChange.toFixed(2)) : null,
      slug: data['slug'],
      url: data['url'],
      description: data['description'],
    };
  },
});
