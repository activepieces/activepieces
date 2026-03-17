import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface CoinGeckoSimplePrice {
  'render-token': {
    usd: number;
    usd_market_cap: number;
    usd_24h_vol: number;
    usd_24h_change: number;
  };
}

interface CoinGeckoCoinData {
  market_data: {
    circulating_supply: number;
    total_supply: number;
    max_supply: number;
    market_cap_rank: number;
    fully_diluted_valuation: Record<string, number>;
  };
}

export const getMarketStats = createAction({
  name: 'get_market_stats',
  displayName: 'Get RENDER Market Stats',
  description:
    'Fetches RENDER token market capitalization, 24h trading volume, circulating supply, and rank from CoinGecko.',
  props: {},
  async run() {
    const [priceResp, coinResp] = await Promise.all([
      httpClient.sendRequest<CoinGeckoSimplePrice>({
        method: HttpMethod.GET,
        url: 'https://api.coingecko.com/api/v3/simple/price',
        queryParams: {
          ids: 'render-token',
          vs_currencies: 'usd',
          include_market_cap: 'true',
          include_24hr_vol: 'true',
          include_24hr_change: 'true',
        },
      }),
      httpClient.sendRequest<CoinGeckoCoinData>({
        method: HttpMethod.GET,
        url: 'https://api.coingecko.com/api/v3/coins/render-token',
        queryParams: {
          localization: 'false',
          tickers: 'false',
          community_data: 'false',
          developer_data: 'false',
          sparkline: 'false',
        },
      }),
    ]);

    const price = priceResp.body['render-token'];
    const coin = coinResp.body.market_data;

    return {
      price_usd: price.usd,
      market_cap_usd: price.usd_market_cap,
      volume_24h_usd: price.usd_24h_vol,
      price_change_24h_percent: price.usd_24h_change,
      market_cap_rank: coin.market_cap_rank,
      circulating_supply: coin.circulating_supply,
      total_supply: coin.total_supply,
      max_supply: coin.max_supply,
      fully_diluted_valuation_usd: coin.fully_diluted_valuation['usd'],
    };
  },
});
