import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getRunePrice = createAction({
  name: 'get_rune_price',
  displayName: 'Get RUNE Price',
  description: 'Fetch the current RUNE token price and market data from CoinGecko (no API key required).',
  auth: undefined,
  props: {
    vsCurrency: Property.StaticDropdown({
      displayName: 'Currency',
      description: 'The currency to display the price in.',
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
    const currency = (context.propsValue.vsCurrency as string) || 'usd';

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/thorchain',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
      },
    });

    const data = response.body as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown>;
    const currentPrice = marketData['current_price'] as Record<string, number>;
    const marketCap = marketData['market_cap'] as Record<string, number>;
    const totalVolume = marketData['total_volume'] as Record<string, number>;
    const priceChangePercent24h = marketData['price_change_percentage_24h'] as number;
    const priceChangePercent7d = marketData['price_change_percentage_7d'] as number;
    const circulatingSupply = marketData['circulating_supply'] as number;
    const totalSupply = marketData['total_supply'] as number;
    const ath = marketData['ath'] as Record<string, number>;

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      price: currentPrice[currency],
      currency,
      market_cap: marketCap[currency],
      total_volume: totalVolume[currency],
      price_change_24h_percent: priceChangePercent24h,
      price_change_7d_percent: priceChangePercent7d,
      circulating_supply: circulatingSupply,
      total_supply: totalSupply,
      all_time_high: ath[currency],
      last_updated: marketData['last_updated'],
    };
  },
});
