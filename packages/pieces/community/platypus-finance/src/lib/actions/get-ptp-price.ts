import { createAction } from '@activepieces/pieces-framework';
import { getTokenPrice } from '../../platypus-finance-api';

export const getPtpPrice = createAction({
  name: 'get-ptp-price',
  displayName: 'Get PTP Price',
  description: 'Get current PTP token price in USD and BTC from CoinGecko',
  props: {},
  async run() {
    const data = await getTokenPrice();
    const ptp = data['platypus-finance'];
    return { priceUsd: ptp?.usd, priceBtc: ptp?.btc, change24h: ptp?.usd_24h_change };
  },
});
