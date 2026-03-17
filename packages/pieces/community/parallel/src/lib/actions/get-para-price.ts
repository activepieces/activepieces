import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface CoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
  market_data: {
    current_price: { usd: number };
    market_cap: { usd: number };
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    total_volume: { usd: number };
    circulating_supply: number;
    total_supply: number;
    ath: { usd: number };
    atl: { usd: number };
  };
}

export const getParaPrice = createAction({
  name: 'get-para-price',
  displayName: 'Get PARA Token Price',
  description: 'Fetch PARA governance token price, market cap, and 24h change from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<CoinGeckoCoin>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/parallel-finance',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
        sparkline: 'false',
      },
    });

    const data = response.body;
    const md = data.market_data;

    return {
      id: data.id,
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      priceUsd: md.current_price.usd,
      priceFormatted: `$${md.current_price.usd.toFixed(6)}`,
      marketCapUsd: md.market_cap.usd,
      marketCapFormatted: `$${(md.market_cap.usd / 1_000_000).toFixed(2)}M`,
      priceChange24h: md.price_change_percentage_24h,
      priceChange24hFormatted: `${md.price_change_percentage_24h?.toFixed(2)}%`,
      priceChange7d: md.price_change_percentage_7d,
      volume24hUsd: md.total_volume.usd,
      circulatingSupply: md.circulating_supply,
      totalSupply: md.total_supply,
      allTimeHigh: md.ath.usd,
      allTimeLow: md.atl.usd,
    };
  },
});
