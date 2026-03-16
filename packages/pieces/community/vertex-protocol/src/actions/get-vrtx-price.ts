import { createAction } from '@activepieces/pieces-framework';
import { fetchVrtxPrice } from '../vertex-api';

export const getVrtxPrice = createAction({
  name: 'get_vrtx_price',
  displayName: 'Get VRTX Price',
  description: 'Fetch the current VRTX token price in USD and BTC with 24h change from CoinGecko.',
  props: {},
  async run() {
    const data = await fetchVrtxPrice();
    const token = data['vertex-protocol-2'];

    return {
      usd: token?.usd ?? null,
      btc: token?.btc ?? null,
      usd_24h_change: token?.usd_24h_change ?? null,
      btc_24h_change: token?.btc_24h_change ?? null,
    };
  },
});
