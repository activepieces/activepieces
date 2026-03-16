import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getEthPrice = createAction({
  name: 'get_eth_price',
  displayName: 'Get ETH Price',
  description: 'Fetch the current ETH (Ethereum) price in USD and other key market data from CoinGecko. Linea uses ETH as its native token.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/ethereum',
      headers: {
        Accept: 'application/json',
      },
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
        sparkline: 'false',
      },
    });

    const data = response.body;
    const marketData = data['market_data'] as Record<string, unknown> | undefined;
    const currentPrice = marketData?.['current_price'] as Record<string, number> | undefined;
    const priceChangePercent = marketData?.['price_change_percentage_24h'];
    const marketCap = marketData?.['market_cap'] as Record<string, number> | undefined;
    const totalVolume = marketData?.['total_volume'] as Record<string, number> | undefined;

    return {
      name: data['name'],
      symbol: data['symbol'],
      price_usd: currentPrice?.['usd'],
      price_change_24h_percent: priceChangePercent,
      market_cap_usd: marketCap?.['usd'],
      total_volume_usd: totalVolume?.['usd'],
      last_updated: marketData?.['last_updated'],
    };
  },
});
