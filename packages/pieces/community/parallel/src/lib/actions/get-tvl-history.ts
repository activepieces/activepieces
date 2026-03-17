import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

export const getTvlHistory = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History',
  description: 'Fetch historical TVL data for Parallel Finance over the last N days from DeFiLlama.',
  props: {
    days: Property.Number({
      displayName: 'Number of Days',
      description: 'How many days of historical TVL data to return (default: 30).',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const days = context.propsValue.days ?? 30;

    const response = await httpClient.sendRequest<TvlDataPoint[]>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/parallel',
    });

    // DeFiLlama protocol endpoint returns tvl array inside body
    const rawBody = response.body as unknown as Record<string, unknown>;
    const tvlArray: TvlDataPoint[] = (rawBody['tvl'] as TvlDataPoint[]) ?? [];

    const cutoff = Date.now() / 1000 - days * 86400;
    const filtered = tvlArray
      .filter((d) => d.date >= cutoff)
      .map((d) => ({
        date: new Date(d.date * 1000).toISOString().split('T')[0],
        timestamp: d.date,
        tvl: d.totalLiquidityUSD,
        tvlFormatted: `$${(d.totalLiquidityUSD / 1_000_000).toFixed(2)}M`,
      }));

    const tvlValues = filtered.map((d) => d.tvl);
    const maxTvl = tvlValues.length ? Math.max(...tvlValues) : 0;
    const minTvl = tvlValues.length ? Math.min(...tvlValues) : 0;
    const latestTvl = filtered.length ? filtered[filtered.length - 1].tvl : 0;
    const earliestTvl = filtered.length ? filtered[0].tvl : 0;

    return {
      protocol: 'Parallel Finance',
      days,
      dataPoints: filtered.length,
      history: filtered,
      stats: {
        latestTvl,
        earliestTvl,
        maxTvl,
        minTvl,
        change: latestTvl - earliestTvl,
        changePercent: earliestTvl > 0 ? `${(((latestTvl - earliestTvl) / earliestTvl) * 100).toFixed(2)}%` : 'N/A',
      },
    };
  },
});
