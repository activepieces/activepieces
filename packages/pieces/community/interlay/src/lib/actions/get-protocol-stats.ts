import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description:
    'Get key statistics for Interlay from DeFiLlama including TVL, chains, category, and 24h change.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/interlay',
    });
    const data = response.body as Record<string, unknown>;
    const tvlHistory = data['tvl'] as Array<{
      date: number;
      totalLiquidityUSD: number;
    }>;
    const latestTvl =
      tvlHistory && tvlHistory.length > 0
        ? tvlHistory[tvlHistory.length - 1].totalLiquidityUSD
        : 0;
    const prevTvl =
      tvlHistory && tvlHistory.length > 1
        ? tvlHistory[tvlHistory.length - 2].totalLiquidityUSD
        : 0;
    const tvlChange =
      prevTvl > 0 ? ((latestTvl - prevTvl) / prevTvl) * 100 : 0;
    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      chains: data['chains'],
      chain_count: Array.isArray(data['chains'])
        ? (data['chains'] as string[]).length
        : 0,
      current_tvl_usd: latestTvl,
      tvl_change_24h_pct: tvlChange,
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
      gecko_id: data['gecko_id'],
    };
  },
});
