import { createAction, Property } from '@activepieces/pieces-framework';
import { coinstatsAuth } from '../../index';
import { makeClient } from '../coinstats-api';

export const getCoinCharts = createAction({
  name: 'get_coin_charts',
  displayName: 'Get Coin Charts',
  description: 'Get historical price chart data for a cryptocurrency over a specified time period.',
  auth: coinstatsAuth,
  props: {
    coinId: Property.ShortText({
      displayName: 'Coin ID',
      description: 'The CoinStats coin ID (e.g. "bitcoin", "ethereum")',
      required: true,
    }),
    period: Property.StaticDropdown({
      displayName: 'Period',
      description: 'Time period for the chart data',
      required: false,
      defaultValue: '1d',
      options: {
        options: [
          { label: '1 Day', value: '1d' },
          { label: '1 Week', value: '1w' },
          { label: '1 Month', value: '1m' },
          { label: '3 Months', value: '3m' },
          { label: '6 Months', value: '6m' },
          { label: '1 Year', value: '1y' },
          { label: 'All Time', value: 'all' },
        ],
      },
    }),
  },
  async run(context) {
    const client = makeClient(context.auth);
    return await client.getCoinCharts(context.propsValue.coinId, {
      period: context.propsValue.period ?? '1d',
    });
  },
});
