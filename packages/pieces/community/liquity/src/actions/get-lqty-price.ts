import { createAction } from '@activepieces/pieces-framework';
import { getLqtyPrice } from '../liquity-api';

export const getLqtyPriceAction = createAction({
  name: 'get_lqty_price',
  displayName: 'Get LQTY Price',
  description: 'Fetch the current LQTY token price from CoinGecko, including USD price, BTC price, and 24h change.',
  props: {},
  async run() {
    return await getLqtyPrice();
  },
});
