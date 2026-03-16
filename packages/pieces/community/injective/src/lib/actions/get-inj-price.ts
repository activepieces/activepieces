import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getInjPrice = createAction({
  name: 'get_inj_price',
  displayName: 'Get INJ Price',
  description: 'Fetch current INJ token price and market data from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/injective-protocol',
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
    const currentPrice = marketData?.['current_price'] as Record<string, unknown> | undefined;
    const marketCap = marketData?.['market_cap'] as Record<string, unknown> | undefined;
    const priceChange24h = marketData?.['price_change_percentage_24h'] as number | undefined;
    const priceChange7d = marketData?.['price_change_percentage_7d'] as number | undefined;

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      priceUsd: currentPrice?.['usd'],
      marketCapUsd: marketCap?.['usd'],
      priceChange24hPercent: priceChange24h,
      priceChange7dPercent: priceChange7d,
      lastUpdated: marketData?.['last_updated'],
    };
  },
});
