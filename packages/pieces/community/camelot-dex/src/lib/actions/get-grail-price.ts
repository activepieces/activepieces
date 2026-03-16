import { createAction } from '@activepieces/pieces-framework';
import { getGrailPrice as fetchGrailPrice } from '../../camelot-api';

export const getGrailPrice = createAction({
  name: 'get_grail_price',
  displayName: 'Get GRAIL Price',
  description: 'Get the current GRAIL token price in USD and BTC with 24h change from CoinGecko.',
  props: {},
  async run() {
    const data = await fetchGrailPrice();
    const grail = data['grail'];

    return {
      price_usd: grail?.usd ?? null,
      price_btc: grail?.btc ?? null,
      change_24h_usd: grail?.usd_24h_change !== undefined
        ? parseFloat(grail.usd_24h_change.toFixed(2))
        : null,
      change_24h_btc: grail?.btc_24h_change !== undefined
        ? parseFloat(grail.btc_24h_change.toFixed(2))
        : null,
    };
  },
});
