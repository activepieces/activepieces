import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData, getCrvTokenData, formatUSD, formatChange } from '../curve-finance-api';

export const getProtocolStatsAction = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Returns a comprehensive stats summary for Curve Finance including TVL, CRV token price, chain count, and market metrics.',
  props: {},
  async run() {
    const [protocolData, tokenData] = await Promise.all([getProtocolData(), getCrvTokenData()]);
    const chainCount = Object.keys(protocolData.chainTvls || {}).length;
    return {
      protocol: {
        name: protocolData.name,
        tvl: protocolData.tvl,
        tvlFormatted: formatUSD(protocolData.tvl),
        change_1h: formatChange(protocolData.change_1h),
        change_1d: formatChange(protocolData.change_1d),
        change_7d: formatChange(protocolData.change_7d),
        chainCount,
      },
      token: {
        name: tokenData.name,
        symbol: tokenData.symbol.toUpperCase(),
        priceUsd: tokenData.market_data.current_price.usd,
        priceFormatted: formatUSD(tokenData.market_data.current_price.usd),
        marketCap: tokenData.market_data.market_cap.usd,
        marketCapFormatted: formatUSD(tokenData.market_data.market_cap.usd),
        priceChange24h: tokenData.market_data.price_change_percentage_24h,
        circulatingSupply: tokenData.market_data.circulating_supply,
      },
    };
  },
});
