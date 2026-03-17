import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { DEFILLAMA_BASE, BEDROCK_SLUG } from '../bedrock-api';

interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

interface HistoricalTvlResponse {
  tvl: TvlDataPoint[];
}

export const getTvlHistoryAction = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History',
  description:
    'Fetch historical TVL data for Bedrock protocol with configurable number of days and percentage change from baseline.',
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

    const response = await httpClient.sendRequest<HistoricalTvlResponse>({
      method: HttpMethod.GET,
      url: `${DEFILLAMA_BASE}/protocol/${BEDROCK_SLUG}`,
    });

    const allTvl = response.body.tvl ?? [];
    const cutoff = Math.floor((Date.now() / 1000) - days * 86400);
    const filtered = allTvl.filter((d) => d.date >= cutoff);

    if (filtered.length === 0) {
      return { days, dataPoints: 0, history: [], changeFromBaseline: null };
    }

    const baseline = filtered[0].totalLiquidityUSD;
    const latest = filtered[filtered.length - 1].totalLiquidityUSD;
    const changeFromBaseline =
      baseline > 0 ? parseFloat((((latest - baseline) / baseline) * 100).toFixed(2)) : null;

    const history = filtered.map((d) => ({
      date: new Date(d.date * 1000).toISOString().split('T')[0],
      timestamp: d.date,
      tvl: d.totalLiquidityUSD,
      tvlFormatted: `$${(d.totalLiquidityUSD / 1_000_000).toFixed(2)}M`,
    }));

    return {
      days,
      dataPoints: history.length,
      baselineTvl: baseline,
      latestTvl: latest,
      changeFromBaseline,
      changeFromBaselineFormatted:
        changeFromBaseline !== null ? `${changeFromBaseline}%` : 'N/A',
      history,
    };
  },
});
