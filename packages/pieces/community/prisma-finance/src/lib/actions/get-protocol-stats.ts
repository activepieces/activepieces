import { createAction } from '@activepieces/pieces-framework';
import {
  getProtocolData,
  getPrismaTokenData,
  formatUSD,
  formatChange,
} from '../prisma-finance-api';

export const getProtocolStatsAction = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Retrieves a combined snapshot of Prisma Finance protocol TVL and PRISMA token price using parallel API calls.',
  props: {},
  async run() {
    const [tvlData, priceData] = await Promise.all([
      getProtocolData(),
      getPrismaTokenData(),
    ]);

    const marketData = priceData.market_data;

    return {
      protocol: {
        name: tvlData.name,
        symbol: tvlData.symbol,
        tvl: tvlData.tvl,
        tvlFormatted: formatUSD(tvlData.tvl),
        change_1h: tvlData.change_1h,
        change_1hFormatted: formatChange(tvlData.change_1h),
        change_1d: tvlData.change_1d,
        change_1dFormatted: formatChange(tvlData.change_1d),
        change_7d: tvlData.change_7d,
        change_7dFormatted: formatChange(tvlData.change_7d),
      },
      token: {
        name: priceData.name,
        symbol: priceData.symbol.toUpperCase(),
        price_usd: marketData.current_price.usd,
        price_formatted: formatUSD(marketData.current_price.usd),
        market_cap_usd: marketData.market_cap.usd,
        market_cap_formatted: formatUSD(marketData.market_cap.usd),
        volume_24h_usd: marketData.total_volume.usd,
        volume_24h_formatted: formatUSD(marketData.total_volume.usd),
        price_change_24h_percent: marketData.price_change_percentage_24h,
        price_change_24h_formatted: formatChange(
          marketData.price_change_percentage_24h
        ),
        last_updated: priceData.last_updated,
      },
    };
  },
});
