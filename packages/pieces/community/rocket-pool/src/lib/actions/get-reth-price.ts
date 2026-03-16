import { createAction } from '@activepieces/pieces-framework';
import { coinGeckoRequest } from '../rocket-pool-api';

export const getRethPrice = createAction({
  name: 'get_reth_price',
  displayName: 'Get rETH Price',
  description: 'Get current price, market cap, and 24h change for Rocket Pool ETH (rETH) via CoinGecko',
  props: {},
  async run() {
    const data = await coinGeckoRequest<any>('/coins/rocket-pool-eth?localization=false&tickers=false&community_data=false&developer_data=false');
    const market = data.market_data ?? {};
    return {
      name: data.name,
      symbol: data.symbol?.toUpperCase(),
      priceUSD: market.current_price?.usd,
      priceETH: market.current_price?.eth,
      marketCapUSD: market.market_cap?.usd,
      totalVolume24hUSD: market.total_volume?.usd,
      priceChange24hPct: market.price_change_percentage_24h,
      priceChange7dPct: market.price_change_percentage_7d,
      circulatingSupply: market.circulating_supply,
      ath: market.ath?.usd,
      atl: market.atl?.usd,
      lastUpdated: data.last_updated,
    };
  },
});
