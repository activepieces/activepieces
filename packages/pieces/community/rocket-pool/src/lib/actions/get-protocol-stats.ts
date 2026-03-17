import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocol, fetchRethCoin } from '../rocket-pool-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetch combined Rocket Pool protocol stats — TVL from DeFiLlama and rETH market data from CoinGecko — in a single parallel call.',
  props: {},
  async run() {
    const [protocol, reth] = await Promise.all([fetchProtocol(), fetchRethCoin()]);

    const tvlHistory = protocol.tvl ?? [];
    const latest = tvlHistory[tvlHistory.length - 1];
    const m = reth.market_data ?? {};

    return {
      protocol: {
        name: protocol.name,
        category: protocol.category,
        chains: protocol.chains,
        totalTvlUSD: latest?.totalLiquidityUSD ?? null,
        tvlAsOf: latest ? new Date(latest.date * 1000).toISOString() : null,
        currentChainTvls: protocol.currentChainTvls,
        url: protocol.url,
      },
      reth: {
        name: reth.name,
        symbol: reth.symbol?.toUpperCase(),
        priceUSD: m.current_price?.usd ?? null,
        priceETH: m.current_price?.eth ?? null,
        marketCapUSD: m.market_cap?.usd ?? null,
        priceChange24hPct: m.price_change_percentage_24h ?? null,
        priceChange7dPct: m.price_change_percentage_7d ?? null,
        lastUpdated: reth.last_updated,
      },
    };
  },
});
