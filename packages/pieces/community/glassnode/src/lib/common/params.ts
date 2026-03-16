import { Property } from '@activepieces/pieces-framework';

export const assetProperty = Property.ShortText({
  displayName: 'Asset',
  description: 'The blockchain asset symbol (e.g., BTC, ETH)',
  required: true,
  defaultValue: 'BTC',
});

export const intervalProperty = Property.StaticDropdown({
  displayName: 'Interval',
  description: 'The time interval for the metric data',
  required: true,
  defaultValue: '24h',
  options: {
    options: [
      { label: '1 Hour', value: '1h' },
      { label: '24 Hours', value: '24h' },
      { label: '1 Week', value: '1w' },
      { label: '1 Month', value: '1month' },
    ],
  },
});

export const sinceProperty = Property.Number({
  displayName: 'Since (Unix Timestamp)',
  description: 'Start time as a Unix timestamp (optional)',
  required: false,
});

export const untilProperty = Property.Number({
  displayName: 'Until (Unix Timestamp)',
  description: 'End time as a Unix timestamp (optional)',
  required: false,
});
