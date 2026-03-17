import { createAction } from '@activepieces/pieces-framework';
import { ProtocolStats, fetchOethCoinData, fetchProtocolData } from '../origin-ether-api';

export const getProtocolStatsAction = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch a combined summary of Origin Ether protocol TVL and OETH token price data in a single parallel call — ideal for dashboards and monitoring.',
  props: {},
  async run() {
    const [protocolData, coinData] = await Promise.all([
      fetchProtocolData(),
      fetchOethCoinData(),
    ]);

    const latestTvlEntry =
      protocolData.tvl && protocolData.tvl.length > 0
        ? protocolData.tvl[protocolData.tvl.length - 1]
        : null;

    const stats: ProtocolStats = {
      protocol: {
        name: protocolData.name,
        tvlUsd: latestTvlEntry?.totalLiquidityUSD ?? 0,
        change1d: protocolData.change_1d,
        change7d: protocolData.change_7d,
        chains: protocolData.chains,
      },
      token: {
        symbol: coinData.symbol.toUpperCase(),
        priceUsd: coinData.market_data.current_price['usd'] ?? 0,
        marketCapUsd: coinData.market_data.market_cap['usd'] ?? 0,
        priceChange24h: coinData.market_data.price_change_percentage_24h ?? null,
      },
      fetchedAt: new Date().toISOString(),
    };

    return stats;
  },
});
