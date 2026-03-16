import { createAction } from '@activepieces/pieces-framework';
import { getTokenPrice } from '../../quickswap-api';

export const getQuickPrice = createAction({
  name: 'get-quick-price',
  displayName: 'Get QUICK Price',
  description: 'Get current QUICK token price in USD and BTC from CoinGecko',
  props: {},
  async run() {
    const data = await getTokenPrice();
    const quick = data['quick'];
    return { priceUsd: quick?.usd, priceBtc: quick?.btc, change24h: quick?.usd_24h_change };
  },
});
