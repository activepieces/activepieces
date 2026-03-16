import { createAction } from '@activepieces/pieces-framework';
import { getSushiPrice as fetchSushiPrice } from '../../sushiswap-api';

export const getSushiPrice = createAction({
  name: 'get_sushi_price',
  displayName: 'Get SUSHI Price',
  description: 'Get SUSHI token price in USD and BTC with 24h change from CoinGecko.',
  props: {},
  async run() {
    const data = await fetchSushiPrice();
    const sushi = data['sushi'];

    return {
      usd: sushi['usd'] ?? null,
      btc: sushi['btc'] ?? null,
      usd_24h_change: sushi['usd_24h_change'] ?? null,
      btc_24h_change: sushi['btc_24h_change'] ?? null,
    };
  },
});
