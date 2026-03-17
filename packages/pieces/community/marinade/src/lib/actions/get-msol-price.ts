import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getMsolPrice = createAction({
  name: 'get_msol_price',
  displayName: 'Get mSOL Price',
  description: 'Fetch the current price and market data for mSOL (Marinade staked SOL liquid staking token) from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/msol',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
        sparkline: 'false',
      },
    });

    const data = response.body;
    const marketData = data['market_data'] as Record<string, unknown>;
    const currentPrice = marketData?.['current_price'] as Record<string, number>;
    const marketCap = marketData?.['market_cap'] as Record<string, number>;
    const totalVolume = marketData?.['total_volume'] as Record<string, number>;
    const priceChange24h = marketData?.['price_change_percentage_24h'] as number;
    const priceChange7d = marketData?.['price_change_percentage_7d'] as number;
    const priceChange30d = marketData?.['price_change_percentage_30d'] as number;
    const circulatingSupply = marketData?.['circulating_supply'] as number;
    const totalSupply = marketData?.['total_supply'] as number;

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      price_usd: currentPrice?.['usd'],
      price_sol: currentPrice?.['sol'],
      market_cap_usd: marketCap?.['usd'],
      volume_24h_usd: totalVolume?.['usd'],
      price_change_24h_pct: priceChange24h,
      price_change_7d_pct: priceChange7d,
      price_change_30d_pct: priceChange30d,
      circulating_supply: circulatingSupply,
      total_supply: totalSupply,
      ath: (marketData?.['ath'] as Record<string, number>)?.['usd'],
      last_updated: data['last_updated'],
    };
  },
});
