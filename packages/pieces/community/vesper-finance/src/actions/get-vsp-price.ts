import { createAction } from '@activepieces/pieces-framework';
import { fetchVspPrice } from '../vesper-api';

export const getVspPrice = createAction({
  name: 'get_vsp_price',
  displayName: 'Get VSP Price',
  description: 'Fetch current VSP token price in USD and BTC with 24h change from CoinGecko.',
  props: {},
  async run() {
    const data = await fetchVspPrice();
    const vsp = data['vesper-finance'];
    return {
      usd: vsp?.usd ?? null,
      btc: vsp?.btc ?? null,
      usd_24h_change: vsp?.usd_24h_change ?? null,
      btc_24h_change: vsp?.btc_24h_change ?? null,
    };
  },
});
