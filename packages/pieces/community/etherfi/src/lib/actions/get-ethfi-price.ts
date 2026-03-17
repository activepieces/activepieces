import { createAction } from '@activepieces/pieces-framework';
import { fetchTokenPrice } from '../etherfi-api';

export const getEthfiPrice = createAction({
  name: 'get-ethfi-price',
  displayName: 'Get ETHFI Token Price',
  description: 'Fetch the current price, market cap, and 24h change for the ETHFI governance token from CoinGecko.',
  props: {},
  async run() {
    const data = await fetchTokenPrice();
    return {
      price_usd: data.price,
      market_cap_usd: data.market_cap,
      change_24h_pct: data.change_24h,
    };
  },
});
