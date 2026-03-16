import { createAction, Property } from '@activepieces/pieces-framework';
import { defiLlamaGet, EQUILIBRIA_SLUG } from '../common/defillama-api';

interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

interface ProtocolHistoryResponse {
  tvl: TvlDataPoint[];
  [key: string]: unknown;
}

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History (30 days)',
  description:
    "Fetch Equilibria Finance's historical TVL for the last 30 days from DeFiLlama.",
  props: {
    days: Property.Number({
      displayName: 'Number of Days',
      description: 'How many days of history to return (default: 30, max: 365).',
      required: false,
      defaultValue: 30,
    }),
  },
  async run({ propsValue }) {
    const days = Math.min(Math.max(Number(propsValue.days ?? 30), 1), 365);
    const data = await defiLlamaGet<ProtocolHistoryResponse>(
      `/protocol/${EQUILIBRIA_SLUG}`
    );

    const allPoints: TvlDataPoint[] = data.tvl ?? [];
    const cutoffTs = Math.floor(Date.now() / 1000) - days * 86400;
    const filtered = allPoints
      .filter((p) => p.date >= cutoffTs)
      .map((p) => ({
        date: new Date(p.date * 1000).toISOString().split('T')[0],
        tvl_usd: p.totalLiquidityUSD,
      }));

    const tvlValues = filtered.map((p) => p.tvl_usd);
    const minTvl = tvlValues.length > 0 ? Math.min(...tvlValues) : 0;
    const maxTvl = tvlValues.length > 0 ? Math.max(...tvlValues) : 0;
    const latestTvl = tvlValues.length > 0 ? tvlValues[tvlValues.length - 1] : 0;
    const oldestTvl = tvlValues.length > 0 ? tvlValues[0] : 0;
    const changePct =
      oldestTvl > 0
        ? Number((((latestTvl - oldestTvl) / oldestTvl) * 100).toFixed(2))
        : 0;

    return {
      days_requested: days,
      data_points: filtered.length,
      latest_tvl_usd: latestTvl,
      min_tvl_usd: minTvl,
      max_tvl_usd: maxTvl,
      change_pct: changePct,
      history: filtered,
    };
  },
});
