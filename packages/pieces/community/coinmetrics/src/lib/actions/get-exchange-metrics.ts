import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchExchangeMetrics } from '../common/coinmetrics-api';

export const getExchangeMetricsAction = createAction({
  name: 'get_exchange_metrics',
  displayName: 'Get Exchange Metrics',
  description: 'Retrieve metrics for a specific exchange (e.g. coinbase, binance, kraken).',
  auth: undefined,
  props: {
    exchanges: Property.ShortText({
      displayName: 'Exchange',
      description: 'The exchange name (e.g. coinbase, binance, kraken). Comma-separate multiple exchanges.',
      required: true,
      defaultValue: 'coinbase',
    }),
    metrics: Property.ShortText({
      displayName: 'Metrics',
      description: 'Comma-separated list of exchange metrics (e.g. volume_reported_spot_usd_1d).',
      required: true,
      defaultValue: 'volume_reported_spot_usd_1d',
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
    const { exchanges, metrics, start_time, end_time, frequency } = context.propsValue;
    return fetchExchangeMetrics({
      exchanges,
      metrics,
      start_time: start_time || undefined,
      end_time: end_time || undefined,
      frequency: frequency || undefined,
    });
  },
});
