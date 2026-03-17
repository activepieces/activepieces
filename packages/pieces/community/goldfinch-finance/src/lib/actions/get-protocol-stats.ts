import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface TvlEntry {
  date: number;
  totalLiquidityUSD: number;
}

interface ProtocolResponse {
  name: string;
  symbol: string;
  chains: string[];
  tvl: TvlEntry[];
}

interface CoinGeckoPrice {
  goldfinch: {
    usd: number;
    usd_market_cap: number;
    usd_24h_change: number;
  };
}

export const getProtocolStats = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetch combined Goldfinch Finance protocol stats including TVL from DeFiLlama and GFI token price from CoinGecko in a single action.',
  props: {},
  async run() {
    const [tvlResponse, priceResponse] = await Promise.all([
      httpClient.sendRequest<ProtocolResponse>({
        method: HttpMethod.GET,
        url: 'https://api.llama.fi/protocol/goldfinch',
      }),
      httpClient.sendRequest<CoinGeckoPrice>({
        method: HttpMethod.GET,
        url: 'https://api.coingecko.com/api/v3/simple/price',
        queryParams: {
          ids: 'goldfinch',
          vs_currencies: 'usd',
          include_market_cap: 'true',
          include_24hr_change: 'true',
        },
      }),
    ]);

    const protocol = tvlResponse.body;
    const tvlHistory = protocol.tvl ?? [];
    const currentTvl =
      tvlHistory.length > 0
        ? tvlHistory[tvlHistory.length - 1].totalLiquidityUSD
        : 0;

    const price = priceResponse.body.goldfinch;

    return {
      protocol: {
        name: protocol.name,
        symbol: protocol.symbol,
        chains: protocol.chains,
        tvlUsd: currentTvl,
      },
      gfi: {
        priceUsd: price.usd,
        marketCapUsd: price.usd_market_cap,
        change24hPercent: price.usd_24h_change,
      },
      fetchedAt: new Date().toISOString(),
    };
  },
});
