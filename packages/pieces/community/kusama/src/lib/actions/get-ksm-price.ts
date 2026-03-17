import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getKsmPrice = createAction({
  name: 'get-ksm-price',
  displayName: 'Get KSM Price',
  description: 'Get the current KSM (Kusama) price, market cap, and 24h change from CoinGecko.',
  props: {
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'The fiat currency to display the price in (e.g. usd, eur, gbp).',
      required: false,
      defaultValue: 'usd',
    }),
  },
  async run(context) {
    const currency = (context.propsValue.currency || 'usd').toLowerCase();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.coingecko.com/api/v3/coins/kusama`,
      queryParams: {
        localization: 'false',
        tickers: 'false',
        market_data: 'true',
        community_data: 'false',
        developer_data: 'false',
        sparkline: 'false',
      },
    });

    const data = response.body as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown>;
    const currentPrice = marketData['current_price'] as Record<string, number>;
    const marketCap = marketData['market_cap'] as Record<string, number>;
    const priceChange24h = marketData['price_change_percentage_24h'];
    const ath = marketData['ath'] as Record<string, number>;
    const circulatingSupply = marketData['circulating_supply'];
    const totalSupply = marketData['total_supply'];

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      price: currentPrice[currency],
      currency: currency.toUpperCase(),
      market_cap: marketCap[currency],
      price_change_24h_percent: priceChange24h,
      all_time_high: ath[currency],
      circulating_supply: circulatingSupply,
      total_supply: totalSupply,
      last_updated: marketData['last_updated'],
    };
  },
});
