import { createAction } from '@activepieces/pieces-framework';

export const getNxmPrice = createAction({
  name: 'get_nxm_price',
  displayName: 'Get wNXM Price',
  description: 'Get wNXM token price and market data from CoinGecko',
  props: {},
  async run() {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/wrapped-nxm?localization=false&tickers=false&community_data=false&developer_data=false'
    );
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    const market = data.market_data;

    return {
      id: data.id,
      symbol: data.symbol?.toUpperCase(),
      name: data.name,
      price_usd: market?.current_price?.usd ?? null,
      price_eth: market?.current_price?.eth ?? null,
      market_cap_usd: market?.market_cap?.usd ?? null,
      fully_diluted_valuation_usd: market?.fully_diluted_valuation?.usd ?? null,
      total_volume_usd: market?.total_volume?.usd ?? null,
      price_change_24h_usd: market?.price_change_24h ?? null,
      price_change_percentage_24h: market?.price_change_percentage_24h ?? null,
      price_change_percentage_7d: market?.price_change_percentage_7d ?? null,
      price_change_percentage_30d: market?.price_change_percentage_30d ?? null,
      ath_usd: market?.ath?.usd ?? null,
      ath_date: market?.ath_date?.usd ?? null,
      circulating_supply: market?.circulating_supply ?? null,
      total_supply: market?.total_supply ?? null,
      last_updated: data.last_updated,
      fetched_at: new Date().toISOString(),
    };
  },
});
