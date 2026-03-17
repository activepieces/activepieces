import { createAction } from '@activepieces/pieces-framework';
import { convexRequest, COINGECKO_BASE_URL } from '../common/convex-api';

export const getCvxTokenStats = createAction({
  name: 'get_cvx_token_stats',
  displayName: 'Get CVX Token Stats',
  description: 'Fetch CVX token price, market cap, 24h volume, and price change data from CoinGecko',
  props: {},
  async run() {
    const data = await convexRequest<any>(
      `${COINGECKO_BASE_URL}/coins/convex-finance?localization=false&tickers=false&community_data=false`
    );

    const market = data.market_data ?? {};
    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      price_usd: market.current_price?.usd,
      market_cap_usd: market.market_cap?.usd,
      volume_24h_usd: market.total_volume?.usd,
      price_change_24h_pct: market.price_change_percentage_24h,
      price_change_7d_pct: market.price_change_percentage_7d,
      ath_usd: market.ath?.usd,
      circulating_supply: market.circulating_supply,
      total_supply: market.total_supply,
      last_updated: data.last_updated,
    };
  },
});
