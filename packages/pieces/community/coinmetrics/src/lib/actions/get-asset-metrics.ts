import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchAssetMetrics } from '../common/coinmetrics-api';

export const getAssetMetricsAction = createAction({
  name: 'get_asset_metrics',
  displayName: 'Get Asset Metrics',
  description: 'Retrieve time series metrics for a specific crypto asset (e.g. BTC, ETH).',
  auth: undefined,
  props: {
    assets: Property.ShortText({
      displayName: 'Asset',
      description: 'The asset symbol (e.g. btc, eth, sol). Comma-separate multiple assets.',
      required: true,
      defaultValue: 'btc',
    }),
    metrics: Property.ShortText({
      displayName: 'Metrics',
      description: 'Comma-separated list of metrics (e.g. PriceUSD,VolumeReported,CapMrktCurUSD,AdrActCnt,TxCnt).',
      required: true,
      defaultValue: 'PriceUSD',
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
          { label: '1 Block', value: '1b' },
        ],
      },
    }),
    limit_per_asset: Property.Number({
      displayName: 'Limit Per Asset',
      description: 'Maximum number of data points to return per asset.',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const { assets, metrics, start_time, end_time, frequency, limit_per_asset } = context.propsValue;
    return fetchAssetMetrics({
      assets,
      metrics,
      start_time: start_time || undefined,
      end_time: end_time || undefined,
      frequency: frequency || undefined,
      limit_per_asset: limit_per_asset || undefined,
    });
  },
});
