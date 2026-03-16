import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTonPrice = createAction({
  name: 'get_ton_price',
  displayName: 'Get TON Price',
  description: 'Fetch the current price, market cap, and 24h volume for TON from CoinGecko.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/the-open-network',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
      },
    });
    const data = response.body as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown>;
    const currentPrice = marketData?.['current_price'] as Record<string, number>;
    const marketCap = marketData?.['market_cap'] as Record<string, number>;
    const volume = marketData?.['total_volume'] as Record<string, number>;

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      price_usd: currentPrice?.['usd'],
      price_btc: currentPrice?.['btc'],
      market_cap_usd: marketCap?.['usd'],
      volume_24h_usd: volume?.['usd'],
      price_change_24h: (marketData?.['price_change_percentage_24h'] as number) ?? null,
      price_change_7d: (marketData?.['price_change_percentage_7d'] as number) ?? null,
      circulating_supply: marketData?.['circulating_supply'] as number,
      total_supply: marketData?.['total_supply'] as number,
      max_supply: marketData?.['max_supply'] as number,
      ath_usd: ((marketData?.['ath'] as Record<string, number>)?.['usd']) ?? null,
      last_updated: marketData?.['last_updated'] as string,
    };
  },
});
