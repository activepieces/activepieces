import { createAction } from '@activepieces/pieces-framework';
import { getElkTokenPrice } from '../common/elk-api';

export const getElkPrice = createAction({
  name: 'get_elk_price',
  displayName: 'Get ELK Token Price',
  description: 'Get the current ELK token price in USD and BTC, including 24-hour price change.',
  auth: undefined,
  props: {},
  async run() {
    const data = await getElkTokenPrice();
    const tokenData = data['elk-finance'] ?? {};
    return {
      usd: tokenData['usd'] ?? null,
      btc: tokenData['btc'] ?? null,
      usd_24h_change: tokenData['usd_24h_change'] ?? null,
    };
  },
});
