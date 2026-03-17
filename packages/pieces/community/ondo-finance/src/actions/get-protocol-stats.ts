import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface ProtocolResponse {
  name: string;
  tvl: number;
  chains: string[];
  chainTvls: Record<string, unknown>;
}

interface OndoPriceResponse {
  'ondo-finance': {
    usd: number;
    usd_market_cap: number;
    usd_24h_change: number;
  };
}

export const getProtocolStats = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetches combined Ondo Finance protocol statistics — TVL from DeFiLlama and ONDO token price from CoinGecko in a single action.',
  props: {},
  async run() {
    const [tvlResponse, priceResponse] = await Promise.all([
      httpClient.sendRequest<ProtocolResponse>({
        method: HttpMethod.GET,
        url: 'https://api.llama.fi/protocol/ondo-finance',
      }),
      httpClient.sendRequest<OndoPriceResponse>({
        method: HttpMethod.GET,
        url: 'https://api.coingecko.com/api/v3/simple/price?ids=ondo-finance&vs_currencies=usd&include_market_cap=true&include_24hr_change=true',
      }),
    ]);

    const tvlData = tvlResponse.body;
    const priceData = priceResponse.body['ondo-finance'];

    return {
      protocol: {
        name: tvlData.name,
        tvl_usd: tvlData.tvl,
        chains: tvlData.chains,
        chain_count: tvlData.chains.length,
      },
      token: {
        symbol: 'ONDO',
        price_usd: priceData.usd,
        market_cap_usd: priceData.usd_market_cap,
        change_24h_percent: priceData.usd_24h_change,
      },
      fetched_at: new Date().toISOString(),
    };
  },
});
