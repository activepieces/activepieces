import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getEusdPrice = createAction({
  name: 'get_eusd_price',
  displayName: 'Get eUSD Price',
  description:
    'Fetch the current price and market data for eUSD, the Lybra Finance yield-bearing stablecoin, from CoinGecko.',
  auth: undefined,
  props: {
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'The fiat currency to display the price in (e.g. usd, eur, gbp)',
      required: false,
      defaultValue: 'usd',
    }),
  },
  async run(context) {
    const currency = (context.propsValue.currency || 'usd').toLowerCase();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/lybra-eusd',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
        sparkline: 'false',
      },
    });

    const data = response.body as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown> | undefined;

    const getPrice = (obj: Record<string, unknown> | undefined, key: string) => {
      if (!obj) return null;
      const sub = obj[key] as Record<string, unknown> | undefined;
      return sub ? sub[currency] ?? null : null;
    };

    return {
      id: data['id'],
      name: data['name'],
      symbol: data['symbol'],
      price: getPrice(marketData, 'current_price'),
      price_change_24h: getPrice(marketData, 'price_change_24h'),
      price_change_percentage_24h: marketData?.['price_change_percentage_24h'] ?? null,
      market_cap: getPrice(marketData, 'market_cap'),
      total_volume: getPrice(marketData, 'total_volume'),
      circulating_supply: marketData?.['circulating_supply'] ?? null,
      total_supply: marketData?.['total_supply'] ?? null,
      currency,
      note: 'eUSD is a yield-bearing stablecoin. Its price should remain near $1 USD while accruing yield.',
    };
  },
});
