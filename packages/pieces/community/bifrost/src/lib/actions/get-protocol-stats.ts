import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocol, fetchBncCoin, ProtocolStats } from '../bifrost-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch a combined snapshot of Bifrost Liquid Staking: TVL from DeFiLlama and BNC price from CoinGecko in a single parallel call.',
  props: {},
  async run() {
    const [protocol, coin] = await Promise.all([
      fetchProtocol(),
      fetchBncCoin(),
    ]);

    const tvl = protocol.tvl ?? 0;
    const priceUSD = coin.market_data.current_price?.['usd'] ?? 0;
    const marketCapUSD = coin.market_data.market_cap?.['usd'] ?? 0;
    const priceChange24h = coin.market_data.price_change_percentage_24h ?? 0;

    const currentChainTvls = protocol.currentChainTvls ?? {};
    const totalTvl = Object.values(currentChainTvls).reduce((sum, v) => sum + v, 0);

    const chainBreakdown = Object.entries(currentChainTvls)
      .map(([chain, chainTvl]) => ({
        chain,
        tvlUSD: chainTvl,
        percentage: totalTvl > 0 ? parseFloat(((chainTvl / totalTvl) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.tvlUSD - a.tvlUSD);

    const stats: ProtocolStats = {
      tvl,
      chains: protocol.chains ?? [],
      bncPriceUSD: priceUSD,
      bncMarketCapUSD: marketCapUSD,
      bncPriceChange24h: priceChange24h,
      fetchedAt: new Date().toISOString(),
    };

    return {
      ...stats,
      tvlFormatted: `$${tvl.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
      bncPriceFormatted: `$${priceUSD.toFixed(6)}`,
      bncMarketCapFormatted: `$${marketCapUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      bncPriceChange24hFormatted: `${priceChange24h >= 0 ? '+' : ''}${priceChange24h.toFixed(2)}%`,
      bncTrend: priceChange24h >= 0 ? 'up' : 'down',
      chainBreakdown,
      protocolName: protocol.name,
      protocolSymbol: protocol.symbol,
      protocolUrl: protocol.url,
    };
  },
});
