import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocol, fetchBrToken } from '../bedrock-api';

export const getProtocolStatsAction = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetch combined Bedrock protocol statistics including TVL and BR token price in a single parallel call.',
  props: {},
  async run() {
    const [protocol, token] = await Promise.all([
      fetchProtocol(),
      fetchBrToken(),
    ]);

    const md = token.market_data;
    const chainTvls = protocol.currentChainTvls;
    const totalChainTvl = Object.values(chainTvls).reduce((s, v) => s + v, 0);

    return {
      protocol: {
        name: protocol.name,
        tvl: protocol.tvl,
        tvlFormatted: `$${(protocol.tvl / 1_000_000).toFixed(2)}M`,
        change1h: protocol.change_1h,
        change1d: protocol.change_1d,
        change7d: protocol.change_7d,
        chainCount: Object.values(chainTvls).filter((v) => v > 0).length,
      },
      token: {
        symbol: token.symbol.toUpperCase(),
        priceUsd: md.current_price.usd,
        priceFormatted: `$${md.current_price.usd.toFixed(6)}`,
        marketCapUsd: md.market_cap.usd,
        marketCapFormatted: `$${(md.market_cap.usd / 1_000_000).toFixed(2)}M`,
        priceChange24h: md.price_change_percentage_24h,
        priceChange24hFormatted: `${md.price_change_percentage_24h?.toFixed(2)}%`,
      },
      summary: {
        totalChainTvl,
        totalChainTvlFormatted: `$${(totalChainTvl / 1_000_000).toFixed(2)}M`,
        fetchedAt: new Date().toISOString(),
      },
    };
  },
});
