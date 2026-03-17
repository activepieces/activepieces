import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData, getCoinData, formatUSD, formatPercent } from '../frax-ether-api';

export const getProtocolStats = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch combined Frax Ether protocol stats — TVL and frxETH price in parallel.',
  props: {},
  async run() {
    const [tvlData, frxEthData] = await Promise.all([
      getProtocolData(),
      getCoinData('frax-ether'),
    ]);

    const tvl = tvlData.tvl;
    const price = frxEthData.market_data.current_price.usd;
    const marketCap = frxEthData.market_data.market_cap.usd;
    const change24h = frxEthData.market_data.price_change_percentage_24h;

    return {
      protocol: {
        name: tvlData.name,
        tvl,
        tvl_formatted: formatUSD(tvl),
        tvl_change_1h: formatPercent(tvlData.change_1h),
        tvl_change_1d: formatPercent(tvlData.change_1d),
        tvl_change_7d: formatPercent(tvlData.change_7d),
        chains: tvlData.chains,
        category: tvlData.category,
      },
      frxeth: {
        symbol: frxEthData.symbol.toUpperCase(),
        price_usd: price,
        price_formatted: formatUSD(price),
        market_cap_usd: marketCap,
        market_cap_formatted: formatUSD(marketCap),
        price_change_24h_percent: change24h,
        price_change_24h_formatted: formatPercent(change24h),
      },
      fetched_at: new Date().toISOString(),
    };
  },
});
