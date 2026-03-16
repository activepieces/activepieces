import { createAction } from '@activepieces/pieces-framework';
import { getPerpPrice as fetchPerpPrice } from '../../perp-api';

export const getPerpPrice = createAction({
  name: 'get_perp_price',
  displayName: 'Get PERP Token Price',
  description: 'Get PERP token price in USD and BTC with 24h change from CoinGecko.',
  props: {},
  async run() {
    const data = await fetchPerpPrice();
    const priceData = data['perpetual-protocol'] ?? {};

    return {
      usd: priceData.usd ?? null,
      btc: priceData.btc ?? null,
      usd_24h_change: priceData.usd_24h_change ?? null,
    };
  },
});
