import { createAction, Property } from '@activepieces/pieces-framework';
import { coingeckoAuth } from '../..';
import { coingeckoRequest } from '../common/coingecko-api';

interface MarketChartResponse {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export const getPriceHistory = createAction({
  name: 'get_price_history',
  displayName: 'Get Price History',
  description:
    'Get historical price chart data for a cryptocurrency over a specified time range.',
  auth: coingeckoAuth,
  requireAuth: false,
  props: {
    coinId: Property.ShortText({
      displayName: 'Coin ID',
      description: 'CoinGecko coin ID (e.g. bitcoin, ethereum, solana)',
      required: true,
    }),
    vsCurrency: Property.ShortText({
      displayName: 'VS Currency',
      description: 'Target currency (e.g. usd, eur, btc)',
      required: false,
      defaultValue: 'usd',
    }),
    days: Property.StaticDropdown({
      displayName: 'Time Range',
      description: 'Number of days of historical data',
      required: true,
      defaultValue: '7',
      options: {
        disabled: false,
        options: [
          { label: '1 Day', value: '1' },
          { label: '7 Days', value: '7' },
          { label: '30 Days', value: '30' },
          { label: '90 Days', value: '90' },
          { label: '365 Days', value: '365' },
          { label: 'Max', value: 'max' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const vsCurrency = propsValue.vsCurrency ?? 'usd';

    const data = await coingeckoRequest<MarketChartResponse>(
      auth as string | undefined,
      `/coins/${encodeURIComponent(propsValue.coinId)}/market_chart`,
      {
        vs_currency: vsCurrency,
        days: propsValue.days,
      }
    );

    return {
      coin_id: propsValue.coinId,
      vs_currency: vsCurrency,
      days: propsValue.days,
      data_points: data.prices.length,
      prices: data.prices,
      market_caps: data.market_caps,
      total_volumes: data.total_volumes,
    };
  },
});
