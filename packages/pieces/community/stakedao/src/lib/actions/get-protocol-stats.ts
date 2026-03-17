import { createAction } from '@activepieces/pieces-framework';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get combined StakeDAO stats including TVL, SDT price, and market cap',
  auth: undefined,
  props: {},
  async run() {
    const [llamaResponse, geckoResponse] = await Promise.all([
      fetch('https://api.llama.fi/protocol/stakedao'),
      fetch(
        'https://api.coingecko.com/api/v3/coins/stake-dao?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false'
      ),
    ]);

    if (!llamaResponse.ok) {
      throw new Error(`DeFiLlama API error: ${llamaResponse.status} ${llamaResponse.statusText}`);
    }
    if (!geckoResponse.ok) {
      throw new Error(`CoinGecko API error: ${geckoResponse.status} ${geckoResponse.statusText}`);
    }

    const [llamaData, geckoData] = await Promise.all([
      llamaResponse.json() as Promise<Record<string, unknown>>,
      geckoResponse.json() as Promise<Record<string, unknown>>,
    ]);

    const tvlArray = llamaData['tvl'] as { totalLiquidityUSD: number }[] | undefined;
    const currentTvl = Array.isArray(tvlArray) ? tvlArray.at(-1)?.totalLiquidityUSD : null;
    const chains = llamaData['chains'] as string[] | undefined;

    const marketData = geckoData['market_data'] as Record<string, unknown> | undefined;
    const currentPrice = marketData?.['current_price'] as Record<string, number> | undefined;
    const marketCap = marketData?.['market_cap'] as Record<string, number> | undefined;
    const priceChange24h = marketData?.['price_change_percentage_24h'] as number | undefined;

    return {
      protocol: {
        name: llamaData['name'],
        category: llamaData['category'],
        tvlUsd: currentTvl,
        chains: chains ?? [],
        totalChains: chains?.length ?? 0,
      },
      token: {
        symbol: geckoData['symbol'],
        name: geckoData['name'],
        priceUsd: currentPrice?.['usd'],
        marketCapUsd: marketCap?.['usd'],
        priceChange24hPercent: priceChange24h,
        lastUpdated: marketData?.['last_updated'],
      },
    };
  },
});
