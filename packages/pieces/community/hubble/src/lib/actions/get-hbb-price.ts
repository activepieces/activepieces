import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export const getHbbPrice = createAction({
  name: 'get_hbb_price',
  displayName: 'Get HBB Token Price',
  description:
    'Fetch the current price and market data for the HBB governance token from CoinGecko (no API key required).',
  auth: undefined,
  requireAuth: false,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      id: string;
      symbol: string;
      name: string;
      market_data: {
        current_price: Record<string, number>;
        market_cap: Record<string, number>;
        total_volume: Record<string, number>;
        price_change_percentage_24h: number;
        price_change_percentage_7d: number;
        circulating_supply: number;
        total_supply: number;
        ath: Record<string, number>;
        atl: Record<string, number>;
      };
      last_updated: string;
    }>({
      method: HttpMethod.GET,
      url: `${COINGECKO_BASE}/coins/hubble-protocol`,
      queryParams: {
        localization: 'false',
        tickers: 'false',
        market_data: 'true',
        community_data: 'false',
        developer_data: 'false',
      },
      headers: {
        Accept: 'application/json',
      },
    });

    const data = response.body;
    const md = data.market_data;

    return {
      id: data.id,
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      priceUSD: md.current_price?.['usd'] ?? null,
      marketCapUSD: md.market_cap?.['usd'] ?? null,
      volume24hUSD: md.total_volume?.['usd'] ?? null,
      priceChange24hPct: md.price_change_percentage_24h ?? null,
      priceChange7dPct: md.price_change_percentage_7d ?? null,
      circulatingSupply: md.circulating_supply ?? null,
      totalSupply: md.total_supply ?? null,
      athUSD: md.ath?.['usd'] ?? null,
      atlUSD: md.atl?.['usd'] ?? null,
      lastUpdated: data.last_updated,
    };
  },
});
