import { createAction } from '@activepieces/pieces-framework';
import { fetchStonePrice, formatUsd } from '../stakestone-api';

export const getStonePriceAction = createAction({
  name: 'get_stone_price',
  displayName: 'Get STONE Price',
  description: 'Fetch current STONE token price, market cap, and 24h price change from CoinGecko.',
  props: {},
  async run() {
    const coin = await fetchStonePrice();
    const md = coin.market_data;

    return {
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      priceUsd: md.current_price.usd,
      priceFormatted: formatUsd(md.current_price.usd),
      marketCapUsd: md.market_cap.usd,
      marketCapFormatted: formatUsd(md.market_cap.usd),
      volume24hUsd: md.total_volume.usd,
      volume24hFormatted: formatUsd(md.total_volume.usd),
      change24h: md.price_change_percentage_24h,
      change24hFormatted: `${md.price_change_percentage_24h >= 0 ? '+' : ''}${md.price_change_percentage_24h.toFixed(2)}%`,
      change7d: md.price_change_percentage_7d,
      change7dFormatted: `${md.price_change_percentage_7d >= 0 ? '+' : ''}${md.price_change_percentage_7d.toFixed(2)}%`,
      circulatingSupply: md.circulating_supply,
      source: 'CoinGecko',
      timestamp: new Date().toISOString(),
    };
  },
});
