import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getHbarPrice = createAction({
  name: 'get-hbar-price',
  displayName: 'Get HBAR Price',
  description: 'Fetch the current USD price, market cap, and 24h volume of HBAR (Hedera native token) from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/hedera-hashgraph',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
        sparkline: 'false',
      },
    });

    const data = response.body as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown>;
    const currentPrice = marketData['current_price'] as Record<string, number>;
    const marketCap = marketData['market_cap'] as Record<string, number>;
    const totalVolume = marketData['total_volume'] as Record<string, number>;

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      price_usd: currentPrice['usd'],
      market_cap_usd: marketCap['usd'],
      total_volume_usd: totalVolume['usd'],
      price_change_24h: marketData['price_change_24h'],
      price_change_percentage_24h: marketData['price_change_percentage_24h'],
      market_cap_rank: marketData['market_cap_rank'],
      circulating_supply: marketData['circulating_supply'],
      total_supply: marketData['total_supply'],
      ath_usd: (marketData['ath'] as Record<string, number>)['usd'],
      last_updated: data['last_updated'],
    };
  },
});
