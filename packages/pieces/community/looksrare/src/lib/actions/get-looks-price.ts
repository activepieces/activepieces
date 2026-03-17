import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getLooksPrice = createAction({
  name: 'get_looks_price',
  displayName: 'Get LOOKS Token Price',
  description: 'Fetch the current price and market data for the LOOKS token from CoinGecko.',
  props: {
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      description: 'The currency to display prices in.',
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
    const currency = (context.propsValue['currency'] as string) || 'usd';
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/looksrare',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
      },
    });

    const data = response.body;
    const marketData = data['market_data'] as Record<string, unknown>;
    const currentPrice = marketData['current_price'] as Record<string, number>;
    const marketCap = marketData['market_cap'] as Record<string, number>;
    const totalVolume = marketData['total_volume'] as Record<string, number>;

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      current_price: currentPrice[currency],
      market_cap: marketCap[currency],
      total_volume: totalVolume[currency],
      price_change_24h: marketData['price_change_24h'],
      price_change_percentage_24h: marketData['price_change_percentage_24h'],
      circulating_supply: marketData['circulating_supply'],
      total_supply: marketData['total_supply'],
      max_supply: marketData['max_supply'],
      last_updated: marketData['last_updated'],
      currency,
    };
  },
});
