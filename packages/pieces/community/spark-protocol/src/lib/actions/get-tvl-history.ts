import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface TvlEntry {
  totalLiquidityUSD: number;
  date: number;
}

interface DeFiLlamaProtocol {
  name: string;
  tvl: TvlEntry[];
}

export const getTvlHistory = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History',
  description: 'Fetch historical TVL data for Spark Protocol from DeFiLlama',
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
    const response = await httpClient.sendRequest<DeFiLlamaProtocol>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/spark',
    });

    const data = response.body;
    const allTvl = data.tvl ?? [];
    const days = context.propsValue.days ?? 30;

    const history = allTvl
      .slice(-days)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvl: entry.totalLiquidityUSD,
        tvlFormatted: entry.totalLiquidityUSD >= 1e9
          ? `$${(entry.totalLiquidityUSD / 1e9).toFixed(2)}B`
          : `$${(entry.totalLiquidityUSD / 1e6).toFixed(2)}M`,
      }));

    const latestTvl = history.length > 0 ? history[history.length - 1].tvl : 0;
    const oldestTvl = history.length > 0 ? history[0].tvl : 0;
    const tvlChange = oldestTvl > 0 ? ((latestTvl - oldestTvl) / oldestTvl) * 100 : 0;

    return {
      history,
      dataPoints: history.length,
      currentTvl: latestTvl,
      currentTvlFormatted: latestTvl >= 1e9
        ? `$${(latestTvl / 1e9).toFixed(2)}B`
        : `$${(latestTvl / 1e6).toFixed(2)}M`,
      tvlChangePct: parseFloat(tvlChange.toFixed(2)),
      periodDays: days,
      timestamp: new Date().toISOString(),
    };
  },
});
