import { createAction } from '@activepieces/pieces-framework';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get combined Origin Protocol stats including TVL, OGN price, and market cap',
  auth: undefined,
  props: {},
  async run() {
    const [llamaResponse, geckoResponse] = await Promise.all([
      fetch('https://api.llama.fi/protocol/origin-protocol'),
      fetch(
        'https://api.coingecko.com/api/v3/coins/origin-protocol?localization=false&tickers=false&community_data=false&developer_data=false'
      ),
    ]);

    if (!llamaResponse.ok) {
      throw new Error(`DeFiLlama API error: ${llamaResponse.status} ${llamaResponse.statusText}`);
    }
    if (!geckoResponse.ok) {
      throw new Error(`CoinGecko API error: ${geckoResponse.status} ${geckoResponse.statusText}`);
    }

    const [llamaData, geckoData] = await Promise.all([
      llamaResponse.json(),
      geckoResponse.json(),
    ]);

    const tvlArray = llamaData.tvl ?? [];
    const latestTvl = tvlArray.length > 0 ? tvlArray[tvlArray.length - 1] : null;
    const marketData = geckoData.market_data ?? {};

    return {
      protocol: {
        name: llamaData.name,
        category: llamaData.category,
        chains: llamaData.chains,
        url: llamaData.url,
        description: llamaData.description,
      },
      tvl: {
        currentUsd: latestTvl ? latestTvl.totalLiquidityUSD : null,
        timestamp: latestTvl ? new Date(latestTvl.date * 1000).toISOString() : null,
      },
      ogn: {
        symbol: geckoData.symbol?.toUpperCase(),
        priceUsd: marketData.current_price?.usd ?? null,
        priceChange24hPercent: marketData.price_change_percentage_24h ?? null,
        marketCapUsd: marketData.market_cap?.usd ?? null,
        volume24hUsd: marketData.total_volume?.usd ?? null,
        circulatingSupply: marketData.circulating_supply ?? null,
      },
      lastUpdated: new Date().toISOString(),
    };
  },
});
