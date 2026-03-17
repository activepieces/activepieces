import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getIcpPrice = createAction({
  name: 'get_icp_price',
  displayName: 'Get ICP Price',
  description: 'Fetch the current ICP token price, market cap, and 24h volume from CoinGecko.',
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
  async run({ propsValue }) {
    const currency = propsValue.currency ?? 'usd';
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: `https://api.coingecko.com/api/v3/coins/internet-computer?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
    });

    const data = response.body;
    const marketData = data['market_data'] as Record<string, unknown>;

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      current_price: (marketData['current_price'] as Record<string, number>)[currency],
      market_cap: (marketData['market_cap'] as Record<string, number>)[currency],
      total_volume: (marketData['total_volume'] as Record<string, number>)[currency],
      price_change_24h: marketData['price_change_24h'],
      price_change_percentage_24h: marketData['price_change_percentage_24h'],
      circulating_supply: marketData['circulating_supply'],
      total_supply: marketData['total_supply'],
      ath: (marketData['ath'] as Record<string, number>)[currency],
      currency,
    };
  },
});
