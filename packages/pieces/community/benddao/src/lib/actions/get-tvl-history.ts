import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History (Last 30 Days)',
  description: 'Fetches the historical TVL data for BendDAO over the last 30 days from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/benddao',
    });

    const data = response.body;
    const tvlArray = data['tvl'] as TvlDataPoint[] | undefined;

    if (!tvlArray || tvlArray.length === 0) {
      return {
        history: [],
        days_returned: 0,
        start_date: null,
        end_date: null,
      };
    }

    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const last30Days = tvlArray.filter((point) => point.date >= thirtyDaysAgo);

    const history = last30Days.map((point) => ({
      date: new Date(point.date * 1000).toISOString().split('T')[0],
      timestamp: point.date,
      tvl_usd: point.totalLiquidityUSD,
    }));

    return {
      history,
      days_returned: history.length,
      start_date: history[0]?.date ?? null,
      end_date: history[history.length - 1]?.date ?? null,
    };
  },
});
