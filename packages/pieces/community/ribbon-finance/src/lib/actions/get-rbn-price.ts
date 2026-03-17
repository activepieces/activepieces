import { createAction } from '@activepieces/pieces-framework';

export const getRbnPrice = createAction({
  name: 'get_rbn_price',
  displayName: 'Get RBN Token Price',
  description: 'Get RBN governance token price, market cap, and 24h change from CoinGecko',
  props: {},
  async run() {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/ribbon-finance?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false'
    );
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    const market = data.market_data;
    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      price_usd: market?.current_price?.usd,
      market_cap_usd: market?.market_cap?.usd,
      price_change_24h: market?.price_change_24h,
      price_change_percentage_24h: market?.price_change_percentage_24h,
      total_volume_usd: market?.total_volume?.usd,
      circulating_supply: market?.circulating_supply,
      total_supply: market?.total_supply,
      ath_usd: market?.ath?.usd,
      last_updated: market?.last_updated,
    };
  },
});
