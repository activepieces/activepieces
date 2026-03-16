import { createAction } from '@activepieces/pieces-framework';
import { getTokenPrice } from '../../trader-joe-api';

export const getJoePrice = createAction({
  name: 'get-joe-price',
  displayName: 'Get JOE Price',
  description: 'Get current JOE token price in USD and BTC from CoinGecko',
  props: {},
  async run() {
    const data = await getTokenPrice();
    const joe = data['joe'];
    return {
      priceUsd: joe?.usd,
      priceBtc: joe?.btc,
      change24h: joe?.usd_24h_change,
    };
  },
});
