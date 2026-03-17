import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

interface CoinGeckoMarketData {
  current_price?: { usd?: number };
  market_cap?: { usd?: number };
  total_volume?: { usd?: number };
  price_change_percentage_24h?: number;
  price_change_percentage_7d?: number;
  circulating_supply?: number;
  total_supply?: number;
  ath?: { usd?: number };
}

interface CoinGeckoCoin {
  id?: string;
  symbol?: string;
  name?: string;
  market_data?: CoinGeckoMarketData;
  last_updated?: string;
}

export const getTnsrPrice = createAction({
  name: 'get_tnsr_price',
  displayName: 'Get TNSR Price',
  description: 'Fetch the current price and market data for the TNSR governance token from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<CoinGeckoCoin>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/tensor',
    });
    const data = response.body;
    const marketData = data.market_data ?? {};
    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      price_usd: marketData.current_price?.usd,
      market_cap_usd: marketData.market_cap?.usd,
      volume_24h_usd: marketData.total_volume?.usd,
      price_change_24h_pct: marketData.price_change_percentage_24h,
      price_change_7d_pct: marketData.price_change_percentage_7d,
      circulating_supply: marketData.circulating_supply,
      total_supply: marketData.total_supply,
      ath_usd: marketData.ath?.usd,
      last_updated: data.last_updated,
    };
  },
});
