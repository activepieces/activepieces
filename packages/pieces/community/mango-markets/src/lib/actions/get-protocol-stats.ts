import { createAction } from '@activepieces/pieces-framework';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get combined Mango Markets protocol statistics: TVL, MNGO price, market cap, and number of markets.',
  auth: undefined,
  props: {},
  async run() {
    const [llamaResp, geckoResp, marketsResp] = await Promise.all([
      fetch('https://api.llama.fi/protocol/mango-markets'),
      fetch('https://api.coingecko.com/api/v3/coins/mango-markets?localization=false&tickers=false&community_data=false&developer_data=false'),
      fetch('https://api.mngo.cloud/data/v4/markets'),
    ]);

    if (!llamaResp.ok) throw new Error(`DeFiLlama error: ${llamaResp.status}`);
    if (!geckoResp.ok) throw new Error(`CoinGecko error: ${geckoResp.status}`);
    if (!marketsResp.ok) throw new Error(`Mango API error: ${marketsResp.status}`);

    const [llama, gecko, marketsData] = await Promise.all([
      llamaResp.json(),
      geckoResp.json(),
      marketsResp.json(),
    ]);

    const chainTvls: Record<string, number> = llama.currentChainTvls ?? {};
    const totalTvl = Object.values(chainTvls).reduce((sum: number, v: number) => sum + v, 0);
    const markets = Array.isArray(marketsData) ? marketsData : (marketsData.markets ?? []);
    const market = gecko.market_data ?? {};

    return {
      tvlUsd: totalTvl,
      primaryChain: 'Solana',
      mngoPrice: market.current_price?.usd ?? null,
      marketCapUsd: market.market_cap?.usd ?? null,
      priceChange24hPercent: market.price_change_percentage_24h ?? null,
      marketsCount: markets.length,
      lastUpdated: new Date().toISOString(),
    };
  },
});
