import { createAction } from '@activepieces/pieces-framework';

export const getMngoPrice = createAction({
  name: 'get_mngo_price',
  displayName: 'Get MNGO Price',
  description: 'Get the current MNGO token price, market cap, and 24h change from CoinGecko.',
  auth: undefined,
  props: {},
  async run() {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/mango-markets?localization=false&tickers=false&community_data=false&developer_data=false'
    );
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    const data = await response.json();
    const market = data.market_data ?? {};

    return {
      priceUsd: market.current_price?.usd ?? null,
      marketCapUsd: market.market_cap?.usd ?? null,
      priceChange24hPercent: market.price_change_percentage_24h ?? null,
      volume24hUsd: market.total_volume?.usd ?? null,
      circulatingSupply: market.circulating_supply ?? null,
      totalSupply: market.total_supply ?? null,
      lastUpdated: market.last_updated ?? null,
    };
  },
});
