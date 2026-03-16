import { createAction } from '@activepieces/pieces-framework';
import { getWooTokenPrice } from '../common/woofi-api';

export const getWooPrice = createAction({
  name: 'get_woo_price',
  displayName: 'Get WOO Token Price',
  description: 'Get WOO token current price in USD and BTC with 24h change',
  props: {},
  async run() {
    const data = await getWooTokenPrice();
    const woo = data['woo-network'];
    return {
      price_usd: woo?.usd,
      price_btc: woo?.btc,
      change_24h_usd: woo?.usd_24h_change,
    };
  },
});
