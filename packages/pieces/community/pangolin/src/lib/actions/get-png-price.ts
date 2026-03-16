import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getPngPriceAction = createAction({
  name: 'get_png_price',
  displayName: 'Get PNG Token Price',
  description:
    'Fetch the current price and market data for the PNG (Pangolin) governance token from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/pangolin',
    });

    const data = response.body as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown> | undefined;
    const currentPrice = marketData?.['current_price'] as Record<string, number> | undefined;
    const marketCap = marketData?.['market_cap'] as Record<string, number> | undefined;
    const totalVolume = marketData?.['total_volume'] as Record<string, number> | undefined;
    const priceChangePercentage24h = marketData?.['price_change_percentage_24h'] as number | undefined;
    const priceChangePercentage7d = marketData?.['price_change_percentage_7d'] as number | undefined;

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      current_price_usd: currentPrice?.['usd'],
      market_cap_usd: marketCap?.['usd'],
      total_volume_usd: totalVolume?.['usd'],
      price_change_percentage_24h: priceChangePercentage24h,
      price_change_percentage_7d: priceChangePercentage7d,
      circulating_supply: (marketData?.['circulating_supply'] as number) ?? null,
      total_supply: (marketData?.['total_supply'] as number) ?? null,
      max_supply: (marketData?.['max_supply'] as number) ?? null,
      ath_usd: (marketData?.['ath'] as Record<string, number> | undefined)?.['usd'],
      last_updated: marketData?.['last_updated'],
    };
  },
});
