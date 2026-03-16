import { createAction } from '@activepieces/pieces-framework';

export const getIndexPrice = createAction({
  name: 'get_index_price',
  displayName: 'Get INDEX Token Price',
  description: 'Get the INDEX governance token price, market cap, and 24h change from CoinGecko',
  props: {},
  async run() {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/index-cooperative?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false'
    );
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    const data = await response.json();
    const market = data.market_data;

    return {
      symbol: data.symbol?.toUpperCase() || 'INDEX',
      name: data.name || 'Index Cooperative',
      priceUsd: market?.current_price?.usd ?? 0,
      marketCapUsd: market?.market_cap?.usd ?? 0,
      change24h: market?.price_change_percentage_24h ?? 0,
      change7d: market?.price_change_percentage_7d ?? 0,
      volume24h: market?.total_volume?.usd ?? 0,
      circulatingSupply: market?.circulating_supply ?? 0,
      totalSupply: market?.total_supply ?? 0,
      ath: market?.ath?.usd ?? 0,
      atl: market?.atl?.usd ?? 0,
      lastUpdated: data.last_updated,
    };
  },
});
