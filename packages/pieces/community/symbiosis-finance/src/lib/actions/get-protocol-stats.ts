import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get Symbiosis Finance key statistics including TVL, chain count, and more from DeFiLlama',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/symbiosis-finance',
    });
    const data = response.body as Record<string, unknown>;
    const tvlArr = data['tvl'] as Array<{date: number; totalLiquidityUSD: number}>;
    const currentTvl = tvlArr && tvlArr.length > 0 ? tvlArr[tvlArr.length - 1].totalLiquidityUSD : 0;
    const prevTvl = tvlArr && tvlArr.length > 1 ? tvlArr[tvlArr.length - 2].totalLiquidityUSD : 0;
    const tvlChange24h = prevTvl > 0 ? ((currentTvl - prevTvl) / prevTvl) * 100 : 0;
    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      chains: data['chains'],
      chain_count: Array.isArray(data['chains']) ? (data['chains'] as string[]).length : 0,
      current_tvl: currentTvl,
      tvl_change_24h_percent: parseFloat(tvlChange24h.toFixed(2)),
      website: data['url'],
      twitter: data['twitter'],
      description: data['description'],
    };
  },
});
