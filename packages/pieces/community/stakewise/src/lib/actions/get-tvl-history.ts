import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { TvlHistoryEntry } from '../stakewise-api';

interface DefiLlamaTvlPoint {
  date: number;
  totalLiquidityUSD: number;
}

interface DefiLlamaProtocolFull {
  tvl: DefiLlamaTvlPoint[];
}

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch historical TVL data for StakeWise over a configurable number of days.',
  auth: undefined,
  props: {
    days: Property.Number({
      displayName: 'Days',
      description: 'Number of historical days to return (default: 30).',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const days = (context.propsValue.days as number) ?? 30;

    const response = await httpClient.sendRequest<DefiLlamaProtocolFull>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/stakewise',
    });

    const allPoints: DefiLlamaTvlPoint[] = response.body.tvl ?? [];

    // Keep only the last `days` data points
    const cutoff = Date.now() / 1000 - days * 86400;
    const filtered = allPoints.filter((p) => p.date >= cutoff);

    if (filtered.length === 0) {
      return {
        days,
        dataPoints: 0,
        baselineTvl: null,
        latestTvl: null,
        totalChange: null,
        history: [],
      };
    }

    const baselineTvl = filtered[0].totalLiquidityUSD;
    const latestTvl = filtered[filtered.length - 1].totalLiquidityUSD;

    const history: TvlHistoryEntry[] = filtered.map((point) => ({
      date: new Date(point.date * 1000).toISOString().split('T')[0],
      tvl: point.totalLiquidityUSD,
      changeFromStart:
        baselineTvl > 0
          ? parseFloat((((point.totalLiquidityUSD - baselineTvl) / baselineTvl) * 100).toFixed(2))
          : 0,
    }));

    const totalChange =
      baselineTvl > 0
        ? parseFloat((((latestTvl - baselineTvl) / baselineTvl) * 100).toFixed(2))
        : 0;

    return {
      days,
      dataPoints: history.length,
      baselineTvl,
      baselineTvlFormatted: `$${baselineTvl.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
      latestTvl,
      latestTvlFormatted: `$${latestTvl.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
      totalChange,
      totalChangeFormatted: `${totalChange >= 0 ? '+' : ''}${totalChange}%`,
      history,
    };
  },
});
