import { createAction } from '@activepieces/pieces-framework';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get combined Index Coop protocol statistics: TVL, INDEX token price, market cap, and chain count',
  props: {},
  async run() {
    const [tvlResponse, priceResponse] = await Promise.all([
      fetch('https://api.llama.fi/protocol/index-coop'),
      fetch(
        'https://api.coingecko.com/api/v3/coins/index-cooperative?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false'
      ),
    ]);

    if (!tvlResponse.ok) {
      throw new Error(`DeFiLlama API error: ${tvlResponse.status}`);
    }
    if (!priceResponse.ok) {
      throw new Error(`CoinGecko API error: ${priceResponse.status}`);
    }

    const [tvlData, priceData] = await Promise.all([tvlResponse.json(), priceResponse.json()]);

    const currentTvl = tvlData.tvl?.length > 0 ? tvlData.tvl[tvlData.tvl.length - 1].totalLiquidityUSD : 0;
    const prevTvl = tvlData.tvl?.length > 1 ? tvlData.tvl[tvlData.tvl.length - 2].totalLiquidityUSD : currentTvl;
    const tvlChange24h = prevTvl > 0 ? ((currentTvl - prevTvl) / prevTvl) * 100 : 0;

    const chains = Object.entries(tvlData.chainTvls || {}).filter(([, chainData]) => {
      if (!chainData.tvl?.length) return false;
      const latest = chainData.tvl[chainData.tvl.length - 1].totalLiquidityUSD;
      return latest > 0;
    });

    const market = priceData.market_data;

    return {
      protocol: 'Index Coop',
      totalTvl: currentTvl,
      tvlChange24h: parseFloat(tvlChange24h.toFixed(2)),
      chainCount: chains.length,
      indexToken: {
        priceUsd: market?.current_price?.usd ?? 0,
        marketCapUsd: market?.market_cap?.usd ?? 0,
        change24h: market?.price_change_percentage_24h ?? 0,
        volume24h: market?.total_volume?.usd ?? 0,
      },
      products: ['DPI', 'MVI', 'ETH2X-FLI', 'icETH', 'BTC2X'],
      productCount: 5,
      lastUpdated: new Date().toISOString(),
    };
  },
});
