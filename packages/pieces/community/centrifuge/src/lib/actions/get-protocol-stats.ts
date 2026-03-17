import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface ProtocolResponse {
  name: string;
  tvl: number;
  chains: string[];
  currentChainTvls: Record<string, number>;
}

interface CoinGeckoPrice {
  centrifuge: {
    usd: number;
    usd_market_cap: number;
    usd_24h_change: number;
  };
}

export const getProtocolStats = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description:
    'Combined action: fetch Centrifuge TVL (DeFiLlama) and CFG token price (CoinGecko) in a single step.',
  props: {},
  async run() {
    const [tvlResponse, priceResponse] = await Promise.all([
      httpClient.sendRequest<ProtocolResponse>({
        method: HttpMethod.GET,
        url: 'https://api.llama.fi/protocol/centrifuge',
      }),
      httpClient.sendRequest<CoinGeckoPrice>({
        method: HttpMethod.GET,
        url: 'https://api.coingecko.com/api/v3/simple/price',
        queryParams: {
          ids: 'centrifuge',
          vs_currencies: 'usd',
          include_market_cap: 'true',
          include_24hr_change: 'true',
        },
      }),
    ]);

    const { name, tvl, chains, currentChainTvls } = tvlResponse.body;
    const cfgData = priceResponse.body.centrifuge;

    return {
      protocol: {
        name,
        tvlUsd: tvl,
        chains,
        currentChainTvls,
      },
      token: {
        symbol: 'CFG',
        priceUsd: cfgData.usd,
        marketCapUsd: cfgData.usd_market_cap,
        change24hPercent: cfgData.usd_24h_change,
      },
    };
  },
});
