import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchPairMetrics } from '../common/coinmetrics-api';

export const getPairMetricsAction = createAction({
  name: 'get_pair_metrics',
  displayName: 'Get Pair Metrics',
  description: 'Retrieve metrics for a specific trading pair (e.g. btc-usd, eth-usd).',
  auth: undefined,
  props: {
    pairs: Property.ShortText({
      displayName: 'Trading Pair',
      description: 'The trading pair (e.g. btc-usd, eth-usd). Comma-separate multiple pairs.',
      required: true,
      defaultValue: 'btc-usd',
    }),
    metrics: Property.ShortText({
      displayName: 'Metrics',
      description: 'Comma-separated list of pair metrics (e.g. price_open,price_close,volume).',
      required: true,
      defaultValue: 'price_close',
    }),
    start_time: Property.ShortText({
      displayName: 'Start Time',
      description: 'Start of the time range in ISO 8601 format (e.g. 2024-01-01). Leave empty for default.',
      required: false,
    }),
    end_time: Property.ShortText({
      displayName: 'End Time',
      description: 'End of the time range in ISO 8601 format (e.g. 2024-12-31). Leave empty for default.',
      required: false,
    }),
    frequency: Property.StaticDropdown({
      displayName: 'Frequency',
      description: 'Data frequency.',
      required: false,
      defaultValue: '1d',
      options: {
        options: [
          { label: '1 Day', value: '1d' },
          { label: '1 Hour', value: '1h' },
        ],
      },
    }),
  },
  async run(context) {
    const { pairs, metrics, start_time, end_time, frequency } = context.propsValue;
    return fetchPairMetrics({
      pairs,
      metrics,
      start_time: start_time || undefined,
      end_time: end_time || undefined,
      frequency: frequency || undefined,
    });
  },
});
