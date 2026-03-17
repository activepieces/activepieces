import { createAction } from '@activepieces/pieces-framework';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Get combined Nexus Mutual stats including TVL, wNXM price, and market cap from DeFiLlama and CoinGecko',
  props: {},
  async run() {
    const [llamaRes, geckoRes] = await Promise.all([
      fetch('https://api.llama.fi/protocol/nexus-mutual'),
      fetch(
        'https://api.coingecko.com/api/v3/coins/wrapped-nxm?localization=false&tickers=false&community_data=false&developer_data=false'
      ),
    ]);

    if (!llamaRes.ok) {
      throw new Error(`DeFiLlama API error: ${llamaRes.status} ${llamaRes.statusText}`);
    }
    if (!geckoRes.ok) {
      throw new Error(`CoinGecko API error: ${geckoRes.status} ${geckoRes.statusText}`);
    }

    const [llamaData, geckoData] = await Promise.all([llamaRes.json(), geckoRes.json()]);

    const chainTvls: Record<string, number> = llamaData.currentChainTvls ?? {};
    const totalTvl = Object.values(chainTvls).reduce((sum: number, v: number) => sum + v, 0);

    const market = geckoData.market_data;

    return {
      protocol: {
        name: llamaData.name,
        category: llamaData.category,
        chains: llamaData.chains,
        url: llamaData.url,
      },
      tvl: {
        total_usd: totalTvl,
        chain_breakdown: chainTvls,
      },
      token: {
        symbol: geckoData.symbol?.toUpperCase(),
        name: geckoData.name,
        price_usd: market?.current_price?.usd ?? null,
        market_cap_usd: market?.market_cap?.usd ?? null,
        total_volume_24h_usd: market?.total_volume?.usd ?? null,
        price_change_24h_pct: market?.price_change_percentage_24h ?? null,
        price_change_7d_pct: market?.price_change_percentage_7d ?? null,
        circulating_supply: market?.circulating_supply ?? null,
      },
      fetched_at: new Date().toISOString(),
    };
  },
});
