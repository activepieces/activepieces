import { createAction, Property } from '@activepieces/pieces-framework';
import { defiLlamaRequest } from '../sudoswap-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description:
    'Retrieve historical TVL data for Sudoswap over the last N days from DeFiLlama.',
  props: {
    days: Property.StaticDropdown({
      displayName: 'Days of History',
      description: 'Number of past days to return.',
      required: true,
      defaultValue: '30',
      options: {
        options: [
          { label: '7 Days', value: '7' },
          { label: '30 Days', value: '30' },
          { label: '90 Days', value: '90' },
          { label: 'All Time', value: 'all' },
        ],
      },
    }),
  },
  async run({ propsValue }) {
    const { days } = propsValue;
    const data = await defiLlamaRequest<any>('/protocol/sudoswap');

    const tvlSeries: Array<{ date: string; tvlUSD: number }> = (data.tvl ?? []).map(
      (entry: { date: number; totalLiquidityUSD: number }) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        tvlUSD: entry.totalLiquidityUSD,
      })
    );

    const limit = days === 'all' ? tvlSeries.length : parseInt(days as string, 10);
    const sliced = tvlSeries.slice(-limit);

    const tvlValues = sliced.map((e) => e.tvlUSD);
    const maxTvl = Math.max(...tvlValues);
    const minTvl = Math.min(...tvlValues);
    const latestTvl = sliced[sliced.length - 1]?.tvlUSD ?? null;
    const earliestTvl = sliced[0]?.tvlUSD ?? null;
    const changePercent =
      earliestTvl && earliestTvl !== 0
        ? (((latestTvl - earliestTvl) / earliestTvl) * 100).toFixed(2)
        : null;

    return {
      history: sliced,
      dataPoints: sliced.length,
      latestTvl,
      maxTvl,
      minTvl,
      changePercent: changePercent !== null ? parseFloat(changePercent) : null,
    };
  },
});
