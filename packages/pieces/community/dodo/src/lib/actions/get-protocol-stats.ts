import { createAction } from '@activepieces/pieces-framework';
import { fetchDefiLlama, fetchCoinGecko } from '../common/dodo-api';

export const getProtocolStats = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description: 'Get combined DODO Protocol stats including TVL, token price, market cap, and chain count.',
  auth: undefined,
  props: {},
  async run() {
    const [defiData, geckoData] = await Promise.all([
      fetchDefiLlama(),
      fetchCoinGecko(),
    ]);

    const tvlHistory = defiData.tvl as Array<{ date: number; totalLiquidityUSD: number }>;
    const totalTvl = tvlHistory && tvlHistory.length > 0 ? tvlHistory[tvlHistory.length - 1].totalLiquidityUSD : 0;
    const prevTvl = tvlHistory && tvlHistory.length > 1 ? tvlHistory[tvlHistory.length - 2].totalLiquidityUSD : totalTvl;
    const tvlChange24h = prevTvl > 0 ? ((totalTvl - prevTvl) / prevTvl) * 100 : 0;

    let chainsCount = 0;
    if (defiData.chainTvls) {
      chainsCount = Object.keys(defiData.chainTvls as object).length;
    }

    const market = geckoData.market_data;

    return {
      tvl: totalTvl,
      tvlChange24h: Math.round(tvlChange24h * 100) / 100,
      price: market.current_price.usd,
      marketCap: market.market_cap.usd,
      priceChange24h: market.price_change_percentage_24h,
      totalVolume24h: market.total_volume.usd,
      chainsCount,
      symbol: geckoData.symbol?.toUpperCase(),
      name: geckoData.name,
    };
  },
});