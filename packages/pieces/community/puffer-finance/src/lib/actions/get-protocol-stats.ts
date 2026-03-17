import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

type DefiLlamaProtocol = {
  name: string;
  tvl: { totalLiquidityUSD: number }[];
  chains: string[];
};

type CoinGeckoPrice = {
  puffer: {
    usd: number;
    usd_market_cap: number;
    usd_24h_change: number;
  };
};

export const getProtocolStats = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetch combined TVL and PUFFER token price data in a single parallel call for efficiency.',
  auth: undefined,
  props: {},
  async run() {
    const [tvlResponse, priceResponse] = await Promise.all([
      httpClient.sendRequest<DefiLlamaProtocol>({
        method: HttpMethod.GET,
        url: 'https://api.llama.fi/protocol/puffer-finance',
      }),
      httpClient.sendRequest<CoinGeckoPrice>({
        method: HttpMethod.GET,
        url: 'https://api.coingecko.com/api/v3/simple/price',
        queryParams: {
          ids: 'puffer',
          vs_currencies: 'usd',
          include_market_cap: 'true',
          include_24hr_change: 'true',
        },
      }),
    ]);

    const tvlData = tvlResponse.body;
    const priceData = priceResponse.body.puffer;

    const currentTvl = tvlData.tvl?.[tvlData.tvl.length - 1]?.totalLiquidityUSD ?? 0;

    return {
      protocol: {
        name: tvlData.name,
        tvl_usd: currentTvl,
        chains: tvlData.chains,
      },
      token: {
        price_usd: priceData.usd,
        market_cap_usd: priceData.usd_market_cap,
        change_24h_pct: priceData.usd_24h_change,
      },
    };
  },
});
