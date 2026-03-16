import { createAction } from '@activepieces/pieces-framework';
import { getTokenPrice } from '../../spookyswap-api';

export const getBooPrice = createAction({
  name: 'get-boo-price',
  displayName: 'Get BOO Price',
  description: 'Get current BOO token price in USD and BTC from CoinGecko',
  props: {},
  async run() {
    const data = await getTokenPrice();
    const boo = data['spookyswap'];
    return { priceUsd: boo?.usd, priceBtc: boo?.btc, change24h: boo?.usd_24h_change };
  },
});
