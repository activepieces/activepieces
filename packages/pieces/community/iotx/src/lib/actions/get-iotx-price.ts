import { createAction } from '@activepieces/pieces-framework';
import { COINGECKO_IOTEX_URL } from '../common';

export const getIotxPrice = createAction({
  name: 'get_iotx_price',
  displayName: 'Get IOTX Price',
  description: 'Get the current IOTX token price, market cap, volume, and 24h change from CoinGecko.',
  props: {},
  async run() {
    const response = await fetch(COINGECKO_IOTEX_URL);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as {
      symbol?: string;
      market_data?: {
        current_price?: { usd?: number };
        market_cap?: { usd?: number };
        total_volume?: { usd?: number };
        price_change_percentage_24h?: number;
      };
    };

    return {
      symbol: data.symbol?.toUpperCase(),
      price_usd: data.market_data?.current_price?.usd,
      market_cap_usd: data.market_data?.market_cap?.usd,
      volume_24h_usd: data.market_data?.total_volume?.usd,
      price_change_24h_pct: data.market_data?.price_change_percentage_24h,
    };
  },
});
