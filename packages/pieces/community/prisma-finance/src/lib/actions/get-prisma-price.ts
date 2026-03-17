import { createAction } from '@activepieces/pieces-framework';
import { getPrismaTokenData, formatUSD, formatChange } from '../prisma-finance-api';

export const getPrismaPriceAction = createAction({
  name: 'get_prisma_price',
  displayName: 'Get PRISMA Price',
  description:
    'Retrieves the current PRISMA token price, market capitalization, and 24h price change from CoinGecko.',
  props: {},
  async run() {
    const data = await getPrismaTokenData();

    const marketData = data.market_data;
    const priceUSD = marketData.current_price.usd;
    const marketCapUSD = marketData.market_cap.usd;
    const change24h = marketData.price_change_percentage_24h;
    const volumeUSD = marketData.total_volume.usd;

    return {
      name: data.name,
      symbol: data.symbol.toUpperCase(),
      price_usd: priceUSD,
      price_formatted: formatUSD(priceUSD),
      market_cap_usd: marketCapUSD,
      market_cap_formatted: formatUSD(marketCapUSD),
      volume_24h_usd: volumeUSD,
      volume_24h_formatted: formatUSD(volumeUSD),
      price_change_24h_percent: change24h,
      price_change_24h_formatted: formatChange(change24h),
      last_updated: data.last_updated,
    };
  },
});
