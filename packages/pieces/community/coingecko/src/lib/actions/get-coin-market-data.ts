import { createAction, Property } from '@activepieces/pieces-framework';
import { coingeckoAuth } from '../..';
import { coingeckoRequest } from '../common/coingecko-api';

interface MarketDataItem {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  high_24h: number;
  low_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  ath: number;
  ath_date: string;
  last_updated: string;
}

export const getCoinMarketData = createAction({
  name: 'get_coin_market_data',
  displayName: 'Get Coin Market Data',
  description:
    'Get full market data for cryptocurrencies including market cap, volume, price changes, and rankings.',
  auth: coingeckoAuth,
  requireAuth: false,
  props: {
    vsCurrency: Property.ShortText({
      displayName: 'VS Currency',
      description: 'Target currency (e.g. usd, eur, btc)',
      required: false,
      defaultValue: 'usd',
    }),
    coinIds: Property.ShortText({
      displayName: 'Coin IDs',
      description:
        'Comma-separated CoinGecko coin IDs to filter (e.g. bitcoin,ethereum). Leave empty for top coins by market cap.',
      required: false,
    }),
    perPage: Property.Number({
      displayName: 'Results Per Page',
      description: 'Number of results per page (1-250)',
      required: false,
      defaultValue: 10,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination',
      required: false,
      defaultValue: 1,
    }),
  },
  async run({ auth, propsValue }) {
    const vsCurrency = propsValue.vsCurrency ?? 'usd';
    const perPage = Math.min(250, Math.max(1, propsValue.perPage ?? 10));
    const page = Math.max(1, propsValue.page ?? 1);

    const params: Record<string, string> = {
      vs_currency: vsCurrency,
      order: 'market_cap_desc',
      per_page: String(perPage),
      page: String(page),
      sparkline: 'false',
    };

    if (propsValue.coinIds) {
      params['ids'] = propsValue.coinIds;
    }

    const data = await coingeckoRequest<MarketDataItem[]>(
      auth as string | undefined,
      '/coins/markets',
      params
    );

    return {
      count: data.length,
      coins: data,
    };
  },
});
