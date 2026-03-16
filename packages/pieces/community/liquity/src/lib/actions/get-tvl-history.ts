import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaRequest } from '../liquity-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History (Last 30 Days)',
  description: 'Get the last 30 days of historical TVL data for Liquity via DeFiLlama',
  props: {},
  async run() {
    const data = await defiLlamaRequest<any>('/protocol/liquity');
    const tvlSeries: Array<{ date: number; totalLiquidityUSD: number }> = data.tvl ?? [];
    
    // Get last 30 days
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const recent = tvlSeries.filter((entry) => entry.date >= thirtyDaysAgo);
    
    const history = recent.map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      timestamp: entry.date,
      tvlUSD: entry.totalLiquidityUSD,
    }));

    const tvlValues = history.map((h) => h.tvlUSD);
    const maxTvl = tvlValues.length ? Math.max(...tvlValues) : 0;
    const minTvl = tvlValues.length ? Math.min(...tvlValues) : 0;
    const latestTvl = history.length ? history[history.length - 1].tvlUSD : 0;

    return {
      protocol: data.name,
      periodDays: 30,
      dataPoints: history.length,
      latestTvlUSD: latestTvl,
      maxTvlUSD: maxTvl,
      minTvlUSD: minTvl,
      history,
    };
  },
});
