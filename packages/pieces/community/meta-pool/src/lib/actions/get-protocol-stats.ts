import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocolTvl, fetchTokenPrice } from '../meta-pool-api';

export const getProtocolStats = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description: 'Get a combined overview of Meta Pool stats including TVL and token price fetched in parallel.',
  props: {},
  async run() {
    const [tvlData, priceData] = await Promise.all([
      fetchProtocolTvl(),
      fetchTokenPrice(),
    ]);

    const totalTvl = Object.values(tvlData.currentChainTvls ?? {}).reduce((a, b) => a + b, 0);
    const price = priceData.market_data?.current_price?.usd ?? 0;
    const marketCap = priceData.market_data?.market_cap?.usd ?? 0;
    const change24h = priceData.market_data?.price_change_percentage_24h ?? 0;

    const chainTvls = tvlData.currentChainTvls ?? {};
    const chainBreakdown = Object.entries(chainTvls)
      .map(([chain, tvl]) => ({
        chain,
        tvl_usd: tvl,
        pct_of_total: totalTvl > 0 ? parseFloat(((tvl / totalTvl) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.tvl_usd - a.tvl_usd);

    return {
      protocol: {
        name: tvlData.name,
        symbol: tvlData.symbol,
        url: tvlData.url,
        description: tvlData.description,
      },
      tvl: {
        total_usd: totalTvl,
        formatted: `$${totalTvl.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
        change_1h_pct: tvlData.change_1h ?? null,
        change_1d_pct: tvlData.change_1d ?? null,
        change_7d_pct: tvlData.change_7d ?? null,
        chains: chainBreakdown,
      },
      token: {
        id: priceData.id,
        symbol: priceData.symbol?.toUpperCase(),
        price_usd: price,
        price_formatted: `$${price.toFixed(6)}`,
        market_cap_usd: marketCap,
        market_cap_formatted: `$${marketCap.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
        change_24h_pct: parseFloat(change24h.toFixed(2)),
      },
      fetched_at: new Date().toISOString(),
    };
  },
});
