import { createAction, Property } from '@activepieces/pieces-framework';
import { cryptoquantAuth, makeApiRequest } from '../common/cryptoquant-api';

export const getFundFlowRatio = createAction({
  name: 'get_fund_flow_ratio',
  displayName: 'Get Fund Flow Ratio',
  description: 'Retrieve the BTC fund flow ratio market indicator.',
  auth: cryptoquantAuth,
  props: {
    exchange: Property.StaticDropdown({
      displayName: 'Exchange',
      description: 'Select the exchange to query.',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All Exchanges', value: 'all' },
          { label: 'Binance', value: 'binance' },
          { label: 'Coinbase', value: 'coinbase' },
          { label: 'Kraken', value: 'kraken' },
          { label: 'Bitfinex', value: 'bitfinex' },
          { label: 'OKX', value: 'okx' },
          { label: 'Huobi', value: 'huobi' },
          { label: 'Bybit', value: 'bybit' },
        ],
      },
    }),
    window: Property.StaticDropdown({
      displayName: 'Time Window',
      description: 'Aggregation window for the data.',
      required: false,
      defaultValue: 'day',
      options: {
        options: [
          { label: 'Day', value: 'day' },
          { label: 'Week', value: 'week' },
          { label: 'Month', value: 'month' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of data points to return (default: 30).',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const { exchange, window, limit } = context.propsValue;
    return makeApiRequest(
      context.auth as string,
      '/btc/market-indicator/fund-flow-ratio',
      {
        exchange: exchange ?? 'all',
        window: window ?? 'day',
        limit: limit ?? 30,
      }
    );
  },
});
