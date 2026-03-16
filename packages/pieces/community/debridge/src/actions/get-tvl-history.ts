import { createAction, Property } from '@activepieces/pieces-framework';
import { debridgeRequest } from '../lib/debridge-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Get historical TVL data for deBridge over the last N days',
  props: {
    days: Property.Number({
      displayName: 'Days',
      description: 'Number of days of historical data to return (default: 30)',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const days = context.propsValue.days ?? 30;
    const data = await debridgeRequest('/protocol/debridge');

    // tvl is an array of { date: unix_timestamp, totalLiquidityUSD: number }
    const tvlSeries: Array<{ date: number; totalLiquidityUSD: number }> =
      data.tvl ?? [];

    const cutoff = Math.floor(Date.now() / 1000) - days * 86400;
    const filtered = tvlSeries
      .filter((entry) => entry.date >= cutoff)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        tvlUsd: entry.totalLiquidityUSD,
      }));

    return {
      protocol: data.name,
      days,
      dataPoints: filtered.length,
      history: filtered,
    };
  },
});
