import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface TvlEntry {
  date: number;
  totalLiquidityUSD: number;
}

interface DefiLlamaProtocol {
  name: string;
  tvl: number;
  chains: string[];
  chainTvls: Record<string, { tvl: TvlEntry[] }>;
}

interface CoinGeckoPrice {
  maple: {
    usd: number;
    usd_market_cap: number;
    usd_24h_change: number;
  };
}

export const getProtocolStatsAction = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetch combined Maple Finance protocol stats: TVL from DeFiLlama and MAPLE token price from CoinGecko in a single action',
  props: {},
  async run() {
    const [tvlResponse, priceResponse] = await Promise.all([
      httpClient.sendRequest<DefiLlamaProtocol>({
        method: HttpMethod.GET,
        url: 'https://api.llama.fi/protocol/maple-finance',
      }),
      httpClient.sendRequest<CoinGeckoPrice>({
        method: HttpMethod.GET,
        url: 'https://api.coingecko.com/api/v3/simple/price',
        queryParams: {
          ids: 'maple',
          vs_currencies: 'usd',
          include_market_cap: 'true',
          include_24hr_change: 'true',
        },
      }),
    ]);

    const protocol = tvlResponse.body;
    const maplePrice = priceResponse.body.maple;
    const chains = protocol.chains ?? Object.keys(protocol.chainTvls ?? {});

    return {
      protocol: {
        name: protocol.name,
        tvl_usd: protocol.tvl,
        chains,
        chain_count: chains.length,
      },
      token: {
        symbol: 'MAPLE',
        price_usd: maplePrice.usd,
        market_cap_usd: maplePrice.usd_market_cap,
        change_24h_percent: maplePrice.usd_24h_change,
      },
      fetched_at: new Date().toISOString(),
    };
  },
});
