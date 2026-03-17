import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History (30 days)',
  description: 'Fetch the last 30 days of historical TVL data for Tensor from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/tensor',
    });
    const data = response.body;
    const tvlArr = (data['tvl'] as TvlDataPoint[]) ?? [];
    const cutoff = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const last30Days = tvlArr
      .filter((point) => point.date >= cutoff)
      .map((point) => ({
        date: new Date(point.date * 1000).toISOString().split('T')[0],
        tvl_usd: point.totalLiquidityUSD,
      }));
    const tvlValues = last30Days.map((d) => d.tvl_usd);
    const minTvl = tvlValues.length > 0 ? Math.min(...tvlValues) : null;
    const maxTvl = tvlValues.length > 0 ? Math.max(...tvlValues) : null;
    const avgTvl =
      tvlValues.length > 0
        ? tvlValues.reduce((sum, v) => sum + v, 0) / tvlValues.length
        : null;
    return {
      protocol: data['name'],
      data_points: last30Days.length,
      min_tvl_usd: minTvl,
      max_tvl_usd: maxTvl,
      avg_tvl_usd: avgTvl,
      history: last30Days,
    };
  },
});
