import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description:
    'Fetch the last 30 days of historical TVL data for Lybra Finance from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/lybra-finance',
    });

    const data = response.body as Record<string, unknown>;

    type TvlEntry = { date: number; totalLiquidityUSD: number };
    const tvlHistory = (data['tvl'] as TvlEntry[] | undefined) ?? [];

    // Last 30 days (entries are daily, take last 30)
    const last30 = tvlHistory.slice(-30);

    const formatted = last30.map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      timestamp: entry.date,
      tvl: entry.totalLiquidityUSD,
      tvl_formatted: '$' + entry.totalLiquidityUSD.toLocaleString(),
    }));

    const latest = formatted[formatted.length - 1];
    const oldest = formatted[0];
    const tvlChange = latest && oldest
      ? ((latest.tvl - oldest.tvl) / oldest.tvl) * 100
      : null;

    return {
      protocol: data['name'],
      period: '30 days',
      data_points: formatted.length,
      latest_tvl: latest?.tvl ?? null,
      oldest_tvl: oldest?.tvl ?? null,
      tvl_change_30d_pct: tvlChange !== null ? Math.round(tvlChange * 100) / 100 : null,
      history: formatted,
    };
  },
});
