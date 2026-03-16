import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getSavaxPrice = createAction({
  name: 'get_savax_price',
  displayName: 'Get sAVAX Price',
  description: 'Fetch the current price and market data for sAVAX (Benqi Liquid Staked AVAX) via CoinGecko.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      id: string;
      symbol: string;
      name: string;
      market_data: {
        current_price: { usd: number };
        market_cap: { usd: number };
        total_volume: { usd: number };
        price_change_percentage_24h: number;
        price_change_percentage_7d: number;
        circulating_supply: number;
        total_supply: number;
        ath: { usd: number };
        ath_date: { usd: string };
      };
      last_updated: string;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/benqi-liquid-staked-avax',
      headers: { 'Accept': 'application/json' },
    });

    const data = response.body;
    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      priceUSD: data.market_data.current_price.usd,
      marketCapUSD: data.market_data.market_cap.usd,
      volume24hUSD: data.market_data.total_volume.usd,
      priceChange24h: data.market_data.price_change_percentage_24h,
      priceChange7d: data.market_data.price_change_percentage_7d,
      circulatingSupply: data.market_data.circulating_supply,
      totalSupply: data.market_data.total_supply,
      athUSD: data.market_data.ath.usd,
      athDate: data.market_data.ath_date.usd,
      lastUpdated: data.last_updated,
    };
  },
});
