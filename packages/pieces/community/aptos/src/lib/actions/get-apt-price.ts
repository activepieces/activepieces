import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getAptPrice = createAction({
  name: 'get_apt_price',
  displayName: 'Get APT Price',
  description: 'Retrieve the current price and market data for APT (Aptos native token) from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/aptos',
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
    const priceChange24h = marketData?.['price_change_percentage_24h'] as number | undefined;
    const marketCap = marketData?.['market_cap'] as Record<string, number> | undefined;
    const totalVolume = marketData?.['total_volume'] as Record<string, number> | undefined;

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      priceUsd: currentPrice?.['usd'],
      priceBtc: currentPrice?.['btc'],
      priceEth: currentPrice?.['eth'],
      priceChangePercentage24h: priceChange24h,
      marketCapUsd: marketCap?.['usd'],
      totalVolumeUsd: totalVolume?.['usd'],
      lastUpdated: marketData?.['last_updated'],
    };
  },
});
