import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface DeFiLlamaProtocol {
  name: string;
  tvl: { totalLiquidityUSD: number }[];
  chains: string[];
}

interface CoinGeckoPrice {
  kamino: {
    usd: number;
    usd_market_cap: number;
    usd_24h_change: number;
  };
}

export const getProtocolStats = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch a combined snapshot of Kamino Finance TVL and KMNO token price in a single call',
  auth: undefined,
  props: {},
  async run() {
    const [tvlResponse, priceResponse] = await Promise.all([
      httpClient.sendRequest<DeFiLlamaProtocol>({
        method: HttpMethod.GET,
        url: 'https://api.llama.fi/protocol/kamino',
      }),
      httpClient.sendRequest<CoinGeckoPrice>({
        method: HttpMethod.GET,
        url: 'https://api.coingecko.com/api/v3/simple/price',
        queryParams: {
          ids: 'kamino',
          vs_currencies: 'usd',
          include_market_cap: 'true',
          include_24hr_change: 'true',
        },
      }),
    ]);

    const tvlData = tvlResponse.body;
    const priceData = priceResponse.body;

    const currentTvl = tvlData.tvl?.[tvlData.tvl.length - 1]?.totalLiquidityUSD ?? 0;
    const kmno = priceData.kamino;

    return {
      protocol: {
        name: tvlData.name,
        tvl: currentTvl,
        chains: tvlData.chains,
      },
      token: {
        price: kmno.usd,
        marketCap: kmno.usd_market_cap,
        change24h: kmno.usd_24h_change,
      },
    };
  },
});
