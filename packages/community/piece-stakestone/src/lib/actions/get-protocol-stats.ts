import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocolDetail, fetchStonePrice, formatUsd } from '../stakestone-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch combined StakeStone protocol stats — TVL and STONE price in a single parallel call.',
  props: {},
  async run() {
    const [protocol, coin] = await Promise.all([
      fetchProtocolDetail(),
      fetchStonePrice(),
    ]);

    const md = coin.market_data;
    const chainTvls = protocol.currentChainTvls ?? {};
    const totalTvl = Object.values(chainTvls).reduce((sum, v) => sum + v, 0) || protocol.tvl;

    const topChains = Object.entries(chainTvls)
      .map(([chain, tvl]) => ({
        chain,
        tvl,
        tvlFormatted: formatUsd(tvl),
        percentage: totalTvl > 0 ? Number(((tvl / totalTvl) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, 5);

    return {
      protocol: {
        name: 'StakeStone',
        slug: 'stakestone',
        tvl: protocol.tvl,
        tvlFormatted: formatUsd(protocol.tvl),
        change1h: protocol.change_1h ?? null,
        change1d: protocol.change_1d ?? null,
        change7d: protocol.change_7d ?? null,
        chains: protocol.chains ?? [],
        topChains,
      },
      token: {
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
      },
      sources: ['DeFiLlama', 'CoinGecko'],
      timestamp: new Date().toISOString(),
    };
  },
});
