import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Retrieve the last 30 days of historical TVL data for Rootstock (RSK) from DeFiLlama.',
  props: {
    days: Property.Number({
      displayName: 'Number of Days',
      description: 'Number of days of history to return (default: 30, max: 365).',
      required: false,
      defaultValue: 30,
    }),
  },
  async run({ propsValue }) {
    const days = Math.min(Math.max(propsValue.days ?? 30, 1), 365);

    const response = await httpClient.sendRequest<{
      name: string;
      tvl: Array<{ date: number; totalLiquidityUSD: number }>;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/rsk',
    });

    const data = response.body;
    const allTvl = data.tvl ?? [];

    // Filter to last N days
    const cutoff = Math.floor(Date.now() / 1000) - days * 86400;
    const filtered = allTvl
      .filter((entry) => entry.date >= cutoff)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvlUsd: entry.totalLiquidityUSD,
      }));

    const tvlValues = filtered.map((e) => e.tvlUsd);
    const maxTvl = tvlValues.length ? Math.max(...tvlValues) : 0;
    const minTvl = tvlValues.length ? Math.min(...tvlValues) : 0;
    const latestTvl = filtered.length ? filtered[filtered.length - 1].tvlUsd : 0;

    return {
      protocol: data.name,
      daysRequested: days,
      dataPoints: filtered.length,
      latestTvlUsd: latestTvl,
      maxTvlUsd: maxTvl,
      minTvlUsd: minTvl,
      history: filtered,
    };
  },
});
