import { createAction } from '@activepieces/pieces-framework';
import { getSwellPrice } from '../swell-api';

export const getSwellPriceAction = createAction({
  name: 'get-swell-price',
  displayName: 'Get SWELL Price',
  description: 'Fetches the current SWELL token price from CoinGecko, including USD price, market cap, and 24-hour price change percentage.',
  props: {},
  async run() {
    return await getSwellPrice();
  },
});
