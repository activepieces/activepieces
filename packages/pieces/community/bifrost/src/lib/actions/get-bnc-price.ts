import { createAction } from '@activepieces/pieces-framework';
import { fetchBncCoin } from '../bifrost-api';

export const getBncPrice = createAction({
  name: 'get_bnc_price',
  displayName: 'Get BNC Price',
  description: 'Fetch the current BNC token price, market cap, and 24h change from CoinGecko.',
  props: {},
  async run() {
    const coin = await fetchBncCoin();

    const marketData = coin.market_data;
    const priceUSD = marketData.current_price?.['usd'] ?? 0;
    const marketCapUSD = marketData.market_cap?.['usd'] ?? 0;
    const volumeUSD = marketData.total_volume?.['usd'] ?? 0;
    const priceChange24h = marketData.price_change_percentage_24h ?? 0;

    return {
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      priceUSD,
      priceFormatted: `$${priceUSD.toFixed(6)}`,
      marketCapUSD,
      marketCapFormatted: `$${marketCapUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      volume24hUSD: volumeUSD,
      priceChange24hPct: priceChange24h,
      priceChange24hFormatted: `${priceChange24h >= 0 ? '+' : ''}${priceChange24h.toFixed(2)}%`,
      trend: priceChange24h >= 0 ? 'up' : 'down',
      fetchedAt: new Date().toISOString(),
    };
  },
});
