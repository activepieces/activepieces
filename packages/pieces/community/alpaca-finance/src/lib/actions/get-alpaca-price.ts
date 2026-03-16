import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getAlpacaPrice = createAction({
  name: 'get_alpaca_price',
  displayName: 'Get ALPACA Price',
  description: 'Fetch current ALPACA token price, market cap, and volume from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/alpaca-finance',
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
    const currentPrice = marketData ? (marketData['current_price'] as Record<string, unknown>) : {};
    const marketCap = marketData ? (marketData['market_cap'] as Record<string, unknown>) : {};
    const totalVolume = marketData ? (marketData['total_volume'] as Record<string, unknown>) : {};
    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      price_usd: currentPrice['usd'],
      price_btc: currentPrice['btc'],
      market_cap_usd: marketCap['usd'],
      total_volume_usd: totalVolume['usd'],
      price_change_24h: marketData ? marketData['price_change_percentage_24h'] : null,
      price_change_7d: marketData ? marketData['price_change_percentage_7d'] : null,
      ath: marketData ? (marketData['ath'] as Record<string, unknown> | undefined)?.['usd'] : null,
      last_updated: data['last_updated'],
    };
  },
});
