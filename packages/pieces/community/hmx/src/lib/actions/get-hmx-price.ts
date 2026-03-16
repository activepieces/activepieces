import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { getHmxPrice as fetchHmxPrice } from '../../hmx-api';

export const getHmxPrice = createAction({
  name: 'get-hmx-price',
  displayName: 'Get HMX Price',
  description: 'Get HMX token price in USD and BTC with 24h change from CoinGecko',
  auth: PieceAuth.None(),
  props: {},
  async run() {
    const data = await fetchHmxPrice();
    const hmx = data['hmx'] || {};
    return {
      usd: hmx['usd'],
      btc: hmx['btc'],
      usd_24h_change: hmx['usd_24h_change'],
      btc_24h_change: hmx['btc_24h_change'],
    };
  },
});
