import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getKncPriceAction = createAction({
  name: 'get_knc_price',
  displayName: 'Get KNC Price',
  description: 'Fetch the current price and market data for Kyber Network Crystal (KNC) token from CoinGecko.',
  props: {
    vsCurrency: Property.ShortText({
      displayName: 'vs Currency',
      description: 'Currency to compare against (e.g. usd, eur, btc)',
      required: false,
      defaultValue: 'usd',
    }),
  },
  async run(context) {
    const vsCurrency = (context.propsValue.vsCurrency || 'usd').toLowerCase();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/kyber-network-crystal',
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
    const currentPrice = marketData?.['current_price'] as Record<string, number> | undefined;
    const marketCap = marketData?.['market_cap'] as Record<string, number> | undefined;
    const totalVolume = marketData?.['total_volume'] as Record<string, number> | undefined;
    const priceChange24h = marketData?.['price_change_percentage_24h'] as number | undefined;
    const priceChange7d = marketData?.['price_change_percentage_7d'] as number | undefined;

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      current_price: currentPrice?.[vsCurrency],
      market_cap: marketCap?.[vsCurrency],
      total_volume: totalVolume?.[vsCurrency],
      price_change_24h_percent: priceChange24h,
      price_change_7d_percent: priceChange7d,
      vs_currency: vsCurrency,
      last_updated: (marketData?.['last_updated'] as string) || null,
    };
  },
});
