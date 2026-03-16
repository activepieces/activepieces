import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../coincap-api';

export const getAssetHistory = createAction({
  name: 'get_asset_history',
  displayName: 'Get Asset Price History',
  description: 'Get historical price data for a cryptocurrency at specified intervals.',
  props: {
    id: Property.ShortText({
      displayName: 'Asset ID',
      description: 'The asset ID (e.g. "bitcoin", "ethereum", "solana").',
      required: true,
    }),
    interval: Property.StaticDropdown({
      displayName: 'Interval',
      description: 'Time interval between data points.',
      required: true,
      options: {
        options: [
          { label: '1 Minute', value: 'm1' },
          { label: '5 Minutes', value: 'm5' },
          { label: '15 Minutes', value: 'm15' },
          { label: '30 Minutes', value: 'm30' },
          { label: '1 Hour', value: 'h1' },
          { label: '2 Hours', value: 'h2' },
          { label: '6 Hours', value: 'h6' },
          { label: '12 Hours', value: 'h12' },
          { label: '1 Day', value: 'd1' },
        ],
      },
      defaultValue: 'd1',
    }),
    start: Property.Number({
      displayName: 'Start Time (Unix ms)',
      description: 'Start of time range in Unix milliseconds (optional).',
      required: false,
    }),
    end: Property.Number({
      displayName: 'End Time (Unix ms)',
      description: 'End of time range in Unix milliseconds (optional).',
      required: false,
    }),
  },
  async run(context) {
    const { id, interval, start, end } = context.propsValue;
    return makeRequest(
      HttpMethod.GET,
      `/assets/${encodeURIComponent(id)}/history`,
      { interval, start, end }
    );
  },
});
