import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getZilPrice = createAction({
  name: 'get_zil_price',
  displayName: 'Get ZIL Price',
  description: 'Fetch the current ZIL token price and market data from CoinGecko.',
  auth: undefined,
  props: {
    vs_currency: Property.StaticDropdown({
      displayName: 'Currency',
      description: 'The target currency for price data',
      required: false,
      defaultValue: 'usd',
      options: {
        options: [
          { label: 'USD', value: 'usd' },
          { label: 'EUR', value: 'eur' },
          { label: 'BTC', value: 'btc' },
          { label: 'ETH', value: 'eth' },
        ],
      },
    }),
  },
  async run(context) {
    const currency = context.propsValue.vs_currency ?? 'usd';

    const response = await httpClient.sendRequest<{
      id: string;
      symbol: string;
      name: string;
      market_data: {
        current_price: Record<string, number>;
        market_cap: Record<string, number>;
        total_volume: Record<string, number>;
        price_change_percentage_24h: number;
        price_change_percentage_7d: number;
        circulating_supply: number;
        total_supply: number;
        max_supply: number | null;
        ath: Record<string, number>;
        atl: Record<string, number>;
      };
    }>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/zilliqa',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
      },
    });

    const data = response.body;
    const md = data.market_data;

    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      current_price: md.current_price[currency],
      market_cap: md.market_cap[currency],
      total_volume: md.total_volume[currency],
      price_change_24h_pct: md.price_change_percentage_24h,
      price_change_7d_pct: md.price_change_percentage_7d,
      circulating_supply: md.circulating_supply,
      total_supply: md.total_supply,
      max_supply: md.max_supply,
      ath: md.ath[currency],
      atl: md.atl[currency],
      currency,
    };
  },
});
