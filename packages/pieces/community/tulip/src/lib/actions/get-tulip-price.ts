import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTulipPrice = createAction({
  name: 'get_tulip_price',
  displayName: 'Get TULIP Token Price',
  description: 'Fetch the current TULIP token price, market cap, and 24h volume from CoinGecko (free public API).',
  props: {},
  async run() {
    let response;
    try {
      response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.coingecko.com/api/v3/coins/solfarm',
      });
    } catch {
      response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.coingecko.com/api/v3/coins/tulip-protocol',
      });
    }
    const data = response.body as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown> | undefined;
    const currentPrice = marketData?.['current_price'] as Record<string, number> | undefined;
    const marketCap = marketData?.['market_cap'] as Record<string, number> | undefined;
    const volume24h = marketData?.['total_volume'] as Record<string, number> | undefined;
    const priceChange24h = marketData?.['price_change_percentage_24h'];
    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      price_usd: currentPrice?.['usd'],
      market_cap_usd: marketCap?.['usd'],
      volume_24h_usd: volume24h?.['usd'],
      price_change_24h_percent: priceChange24h,
      last_updated: marketData?.['last_updated'] as string | undefined,
    };
  },
});
