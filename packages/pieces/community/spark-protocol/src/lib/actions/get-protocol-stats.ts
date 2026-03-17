import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface DeFiLlamaProtocol {
  name: string;
  tvl: { totalLiquidityUSD: number; date: number }[];
  chains: string[];
}

interface CoinGeckoPrice {
  spark: {
    usd: number;
    usd_market_cap: number;
    usd_24h_change: number;
  };
}

export const getProtocolStats = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch combined Spark Protocol TVL and SPK token price stats in one call',
  auth: undefined,
  props: {},
  async run() {
    const [tvlResponse, priceResponse] = await Promise.all([
      httpClient.sendRequest<DeFiLlamaProtocol>({
        method: HttpMethod.GET,
        url: 'https://api.llama.fi/protocol/spark',
      }),
      httpClient.sendRequest<CoinGeckoPrice>({
        method: HttpMethod.GET,
        url: 'https://api.coingecko.com/api/v3/simple/price?ids=spark&vs_currencies=usd&include_market_cap=true&include_24hr_change=true',
      }),
    ]);

    const tvlData = tvlResponse.body;
    const priceData = priceResponse.body;

    const currentTvl = tvlData.tvl?.[tvlData.tvl.length - 1]?.totalLiquidityUSD ?? 0;
    const sparkPrice = priceData.spark;

    return {
      protocol: {
        name: tvlData.name,
        tvl: currentTvl,
        tvlFormatted: `$${(currentTvl / 1e9).toFixed(2)}B`,
        chains: tvlData.chains,
        chainCount: tvlData.chains?.length ?? 0,
      },
      token: {
        symbol: 'SPK',
        price: sparkPrice.usd,
        priceFormatted: `$${sparkPrice.usd.toFixed(6)}`,
        marketCap: sparkPrice.usd_market_cap,
        marketCapFormatted: `$${(sparkPrice.usd_market_cap / 1e6).toFixed(2)}M`,
        change24h: sparkPrice.usd_24h_change,
        change24hFormatted: `${sparkPrice.usd_24h_change.toFixed(2)}%`,
      },
      timestamp: new Date().toISOString(),
    };
  },
});
