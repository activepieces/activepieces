import { createAction } from '@activepieces/pieces-framework';
import { fetchRethCoin } from '../rocket-pool-api';

export const getRethPrice = createAction({
  name: 'get_reth_price',
  displayName: 'Get rETH Price',
  description:
    'Fetch the current price, market cap, and 24h change for Rocket Pool ETH (rETH) from CoinGecko.',
  props: {},
  async run() {
    const data = await fetchRethCoin();
    const m = data.market_data ?? {};
    return {
      name: data.name,
      symbol: data.symbol?.toUpperCase(),
      priceUSD: m.current_price?.usd ?? null,
      priceETH: m.current_price?.eth ?? null,
      marketCapUSD: m.market_cap?.usd ?? null,
      totalVolume24hUSD: m.total_volume?.usd ?? null,
      priceChange24hPct: m.price_change_percentage_24h ?? null,
      priceChange7dPct: m.price_change_percentage_7d ?? null,
      circulatingSupply: m.circulating_supply ?? null,
      ath: m.ath?.usd ?? null,
      atl: m.atl?.usd ?? null,
      lastUpdated: data.last_updated,
    };
  },
});
