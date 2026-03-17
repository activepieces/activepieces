import { createAction } from '@activepieces/pieces-framework';

export const getOgnPrice = createAction({
  name: 'get_ogn_price',
  displayName: 'Get OGN Price',
  description: 'Get OGN governance token price, market cap, and 24h change from CoinGecko',
  auth: undefined,
  props: {},
  async run() {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/origin-protocol?localization=false&tickers=false&community_data=false&developer_data=false'
    );
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    const marketData = data.market_data ?? {};

    return {
      id: data.id,
      symbol: data.symbol?.toUpperCase(),
      name: data.name,
      priceUsd: marketData.current_price?.usd ?? null,
      priceChange24hPercent: marketData.price_change_percentage_24h ?? null,
      priceChange7dPercent: marketData.price_change_percentage_7d ?? null,
      marketCapUsd: marketData.market_cap?.usd ?? null,
      volume24hUsd: marketData.total_volume?.usd ?? null,
      circulatingSupply: marketData.circulating_supply ?? null,
      totalSupply: marketData.total_supply ?? null,
      allTimeHighUsd: marketData.ath?.usd ?? null,
      lastUpdated: data.last_updated,
    };
  },
});
