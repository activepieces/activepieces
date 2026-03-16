import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { coinpaprikaAuth } from '../../index';
import { COINPAPRIKA_BASE_URL, buildAuthHeaders } from '../common';

export const getCoinOhlcv = createAction({
  name: 'get_coin_ohlcv',
  auth: coinpaprikaAuth,
  displayName: 'Get Coin OHLCV Historical Data',
  description:
    'Fetch historical OHLCV (Open, High, Low, Close, Volume) candlestick data for a specific cryptocurrency.',
  props: {
    coin_id: Property.ShortText({
      displayName: 'Coin ID',
      description:
        "The CoinPaprika coin ID (e.g. 'btc-bitcoin', 'eth-ethereum'). Visit coinpaprika.com to find coin IDs.",
      required: true,
    }),
    start: Property.ShortText({
      displayName: 'Start Date',
      description:
        "Start date in ISO 8601 format (e.g. '2024-01-01' or '2024-01-01T00:00:00Z').",
      required: true,
    }),
    end: Property.ShortText({
      displayName: 'End Date',
      description:
        "End date in ISO 8601 format (e.g. '2024-01-31' or '2024-01-31T23:59:59Z'). Defaults to current date.",
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description:
        'Maximum number of candles to return (1–366). Defaults to 1.',
      required: false,
      defaultValue: 1,
    }),
    quote: Property.ShortText({
      displayName: 'Quote Currency',
      description: "Quote currency for price data (e.g. 'usd', 'btc'). Defaults to 'usd'.",
      required: false,
      defaultValue: 'usd',
    }),
    interval: Property.StaticDropdown({
      displayName: 'Interval',
      description: 'Time interval for each candle.',
      required: false,
      defaultValue: '24h',
      options: {
        options: [
          { label: '15 minutes', value: '15m' },
          { label: '30 minutes', value: '30m' },
          { label: '1 hour', value: '1h' },
          { label: '6 hours', value: '6h' },
          { label: '12 hours', value: '12h' },
          { label: '24 hours (1 day)', value: '24h' },
          { label: '7 days', value: '7d' },
          { label: '14 days', value: '14d' },
          { label: '30 days', value: '30d' },
          { label: '90 days', value: '90d' },
          { label: '365 days', value: '365d' },
        ],
      },
    }),
  },
  async run(context) {
    const coinId = context.propsValue.coin_id.trim();
    if (!coinId) {
      throw new Error('Coin ID cannot be empty.');
    }

    const start = context.propsValue.start.trim();
    if (!start) {
      throw new Error('Start date cannot be empty.');
    }

    const limitRaw = context.propsValue.limit ?? 1;
    const limit = Math.max(1, Math.min(366, Math.floor(Number(limitRaw))));

    const quote = (context.propsValue.quote ?? 'usd').trim().toLowerCase() || 'usd';
    const interval = context.propsValue.interval ?? '24h';

    const params = new URLSearchParams({
      start,
      limit: String(limit),
      quote,
      interval,
    });

    if (context.propsValue.end && context.propsValue.end.trim()) {
      params.set('end', context.propsValue.end.trim());
    }

    const url = `${COINPAPRIKA_BASE_URL}/coins/${encodeURIComponent(coinId)}/ohlcv/historical?${params.toString()}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: buildAuthHeaders(context.auth),
    });

    const data = response.body;
    if (!Array.isArray(data)) {
      throw new Error(
        `Unexpected response from CoinPaprika OHLCV endpoint for coin: ${coinId}`
      );
    }

    return { ohlcv: data, count: data.length, coin_id: coinId };
  },
});
