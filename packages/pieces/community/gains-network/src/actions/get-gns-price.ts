import { createAction } from '@activepieces/pieces-framework';
import { fetchGnsPrice } from '../gains-api';

export const getGnsPrice = createAction({
  name: 'get_gns_price',
  displayName: 'Get GNS Price',
  description: 'Fetch the current GNS token price in USD and BTC with 24h change from CoinGecko.',
  props: {},
  async run() {
    const data = await fetchGnsPrice();
    const gns = data['gains-network'];
    return {
      usd: gns['usd'],
      btc: gns['btc'],
      usd_24h_change: gns['usd_24h_change'],
      btc_24h_change: gns['btc_24h_change'],
    };
  },
});
