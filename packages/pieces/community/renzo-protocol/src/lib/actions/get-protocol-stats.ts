import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

type DefiLlamaProtocol = {
  name: string;
  tvl: { totalLiquidityUSD: number }[];
  chains: string[];
};

type CoinGeckoPrice = {
  renzo: {
    usd: number;
    usd_market_cap: number;
    usd_24h_change: number;
  };
};

export const getProtocolStats = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch combined Renzo Protocol TVL and REZ token price data in a single call',
  auth: undefined,
  props: {},
  async run() {
    const [tvlResponse, priceResponse] = await Promise.all([
      httpClient.sendRequest<DefiLlamaProtocol>({
        method: HttpMethod.GET,
        url: 'https://api.llama.fi/protocol/renzo',
      }),
      httpClient.sendRequest<CoinGeckoPrice>({
        method: HttpMethod.GET,
        url: 'https://api.coingecko.com/api/v3/simple/price',
        queryParams: {
          ids: 'renzo',
          vs_currencies: 'usd',
          include_market_cap: 'true',
          include_24hr_change: 'true',
        },
      }),
    ]);

    const tvlData = tvlResponse.body;
    const currentTvl = tvlData.tvl?.[tvlData.tvl.length - 1]?.totalLiquidityUSD ?? 0;
    const rez = priceResponse.body.renzo;

    return {
      protocol: {
        name: tvlData.name,
        tvl: currentTvl,
        tvlFormatted: `$${(currentTvl / 1e9).toFixed(2)}B`,
        chains: tvlData.chains,
        chainCount: tvlData.chains?.length ?? 0,
      },
      token: {
        symbol: 'REZ',
        price: rez.usd,
        priceFormatted: `$${rez.usd.toFixed(6)}`,
        marketCap: rez.usd_market_cap,
        marketCapFormatted: `$${(rez.usd_market_cap / 1e6).toFixed(2)}M`,
        change24h: rez.usd_24h_change,
        change24hFormatted: `${rez.usd_24h_change.toFixed(2)}%`,
      },
      fetchedAt: new Date().toISOString(),
    };
  },
});
