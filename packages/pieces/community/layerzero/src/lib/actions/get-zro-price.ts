import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getZroPrice = createAction({
  name: 'get_zro_price',
  displayName: 'Get ZRO Price',
  description: 'Fetch the current ZRO token price, market cap, and 24h volume from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/layerzero',
    });
    const data = response.body as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown> | undefined;
    const currentPrice = marketData?.['current_price'] as Record<string, unknown> | undefined;
    const marketCap = marketData?.['market_cap'] as Record<string, unknown> | undefined;
    const totalVolume = marketData?.['total_volume'] as Record<string, unknown> | undefined;
    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      priceUsd: currentPrice?.['usd'],
      marketCapUsd: marketCap?.['usd'],
      volume24hUsd: totalVolume?.['usd'],
      priceChangePercent24h: (marketData?.['price_change_percentage_24h'] as number | undefined),
      lastUpdated: (marketData?.['last_updated'] as string | undefined),
    };
  },
});
