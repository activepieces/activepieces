import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchAnkrProtocol, DefiLlamaTvlEntry } from '../ankr-api';

interface HistoricalTvlEntry {
  date: string;
  timestamp: number;
  tvl: number;
  change_from_baseline_percent: number;
}

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: "Fetch historical TVL data for Ankr from DeFiLlama with configurable time range.",
  auth: undefined,
  props: {
    days: Property.Number({
      displayName: 'Days',
      description: 'Number of historical days to retrieve (default: 30)',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const days = context.propsValue.days ?? 30;
    const protocol = await fetchAnkrProtocol();

    // DeFiLlama returns tvl as array of {date, totalLiquidityUSD}
    const tvlData: DefiLlamaTvlEntry[] = (protocol as unknown as { tvl: DefiLlamaTvlEntry[] }).tvl ?? [];

    const cutoffTimestamp = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;
    const filtered = tvlData.filter((entry) => entry.date >= cutoffTimestamp);

    const baseline = filtered.length > 0 ? filtered[0].totalLiquidityUSD : 0;

    const history: HistoricalTvlEntry[] = filtered.map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      timestamp: entry.date,
      tvl: entry.totalLiquidityUSD,
      change_from_baseline_percent:
        baseline > 0
          ? parseFloat((((entry.totalLiquidityUSD - baseline) / baseline) * 100).toFixed(2))
          : 0,
    }));

    const latest = history[history.length - 1];
    const earliest = history[0];

    return {
      days_requested: days,
      data_points: history.length,
      baseline_tvl: baseline,
      latest_tvl: latest?.tvl ?? null,
      overall_change_percent:
        baseline > 0 && latest
          ? parseFloat((((latest.tvl - baseline) / baseline) * 100).toFixed(2))
          : null,
      period_start: earliest?.date ?? null,
      period_end: latest?.date ?? null,
      history,
    };
  },
});
