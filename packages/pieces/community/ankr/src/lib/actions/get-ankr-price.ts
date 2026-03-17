import { createAction } from '@activepieces/pieces-framework';
import { fetchAnkrPrice } from '../ankr-api';

export const getAnkrPrice = createAction({
  name: 'get_ankr_price',
  displayName: 'Get ANKR Price',
  description: 'Fetch the current ANKR token price, market cap, and 24-hour change from CoinGecko.',
  auth: undefined,
  props: {},
  async run() {
    const priceData = await fetchAnkrPrice();
    const ankr = priceData['ankr-network'];

    return {
      price_usd: ankr.usd,
      market_cap_usd: ankr.usd_market_cap,
      change_24h_percent: ankr.usd_24h_change,
    };
  },
});
