import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { lunarCrushRequest } from '../lunarcrush-api';

export const getCoinTimeSeries = createAction({
  name: 'get_coin_time_series',
  displayName: 'Get Coin Time Series',
  description: 'Fetch historical social and market data time series for a specific cryptocurrency.',
  props: {
    coin: Property.ShortText({
      displayName: 'Coin Symbol or Slug',
      description: 'The coin symbol or slug (e.g. "bitcoin" or "BTC")',
      required: true,
    }),
    bucket: Property.StaticDropdown({
      displayName: 'Time Bucket',
      description: 'Time interval for each data point',
      required: false,
      defaultValue: 'day',
      options: {
        options: [
          { label: 'Hour', value: 'hour' },
          { label: 'Day', value: 'day' },
          { label: 'Week', value: 'week' },
        ],
      },
    }),
    start: Property.Number({
      displayName: 'Start Time (Unix timestamp)',
      description: 'Start of the time range as a Unix timestamp (seconds). Defaults to 30 days ago.',
      required: false,
    }),
    end: Property.Number({
      displayName: 'End Time (Unix timestamp)',
      description: 'End of the time range as a Unix timestamp (seconds). Defaults to now.',
      required: false,
    }),
  },
  auth: PieceAuth.SecretText({
    displayName: 'LunarCrush API Key',
    required: true,
    description: 'Your LunarCrush API key. Get one at https://lunarcrush.com/developers',
  }),
  async run({ propsValue, auth }) {
    const coin = propsValue.coin.trim().toLowerCase();
    const nowSec = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = nowSec - 30 * 24 * 60 * 60;

    const params: Record<string, string | number> = {
      bucket: (propsValue.bucket as string) ?? 'day',
      start: propsValue.start ?? thirtyDaysAgo,
      end: propsValue.end ?? nowSec,
    };

    const data = await lunarCrushRequest(
      auth as string,
      `/coins/${encodeURIComponent(coin)}/time-series/v2`,
      params
    );
    return data;
  },
});
