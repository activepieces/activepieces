import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const DEFILLAMA_BASE = 'https://api.llama.fi';

interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

interface ProtocolResponse {
  tvl: TvlDataPoint[];
  name: string;
  symbol: string;
}

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description:
    'Fetch the last N days of historical TVL data for Hubble Protocol from DeFiLlama.',
  auth: undefined,
  requireAuth: false,
  props: {
    days: Property.Number({
      displayName: 'Number of Days',
      description: 'How many recent days of TVL history to return (default: 30)',
      required: false,
      defaultValue: 30,
    }),
  },
  async run({ propsValue }) {
    const days = propsValue.days ?? 30;

    const response = await httpClient.sendRequest<ProtocolResponse>({
      method: HttpMethod.GET,
      url: `${DEFILLAMA_BASE}/protocol/hubble`,
      headers: {
        Accept: 'application/json',
      },
    });

    const data = response.body;
    const allTvl = data.tvl ?? [];

    const cutoffTs = Math.floor(Date.now() / 1000) - days * 86400;
    const filtered = allTvl
      .filter((p) => p.date >= cutoffTs)
      .map((p) => ({
        date: new Date(p.date * 1000).toISOString().slice(0, 10),
        tvlUSD: p.totalLiquidityUSD,
      }));

    const tvlValues = filtered.map((p) => p.tvlUSD);
    const minTvl = tvlValues.length > 0 ? Math.min(...tvlValues) : null;
    const maxTvl = tvlValues.length > 0 ? Math.max(...tvlValues) : null;
    const avgTvl =
      tvlValues.length > 0
        ? tvlValues.reduce((a, b) => a + b, 0) / tvlValues.length
        : null;

    return {
      protocol: data.name,
      symbol: data.symbol,
      daysRequested: days,
      dataPoints: filtered.length,
      minTvlUSD: minTvl,
      maxTvlUSD: maxTvl,
      avgTvlUSD: avgTvl ? parseFloat(avgTvl.toFixed(2)) : null,
      history: filtered,
    };
  },
});
