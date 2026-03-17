import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface TvlEntry {
  date: number;
  totalLiquidityUSD: number;
}

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History (Last 30 Days)',
  description: 'Fetch the last 30 days of historical TVL data for the NFTX protocol from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/nftx',
    });
    const data = response.body;
    const tvlArray = data['tvl'] as TvlEntry[];

    const last30 = tvlArray.slice(-30).map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      timestamp: entry.date,
      tvl_usd: entry.totalLiquidityUSD,
    }));

    const tvlValues = last30.map((e) => e.tvl_usd);
    const maxTvl = Math.max(...tvlValues);
    const minTvl = Math.min(...tvlValues);
    const avgTvl = tvlValues.reduce((a, b) => a + b, 0) / tvlValues.length;

    return {
      period: '30 days',
      data_points: last30.length,
      history: last30,
      stats: {
        max_tvl_usd: maxTvl,
        min_tvl_usd: minTvl,
        avg_tvl_usd: Math.round(avgTvl),
        current_tvl_usd: last30[last30.length - 1]?.tvl_usd ?? 0,
        start_tvl_usd: last30[0]?.tvl_usd ?? 0,
      },
    };
  },
});
