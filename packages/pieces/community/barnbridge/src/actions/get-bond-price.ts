import { createAction } from '@activepieces/pieces-framework';
import { fetchBondPrice } from '../barnbridge-api';

export const getBondPrice = createAction({
  name: 'get_bond_price',
  displayName: 'Get BOND Token Price',
  description: 'Get the current price of the BOND token in USD and BTC with 24-hour change percentage.',
  props: {},
  async run() {
    const data = await fetchBondPrice();
    const bond = data['barnbridge'];

    return {
      usd: bond?.usd ?? null,
      btc: bond?.btc ?? null,
      usd_24h_change: bond?.usd_24h_change ?? null,
      btc_24h_change: bond?.btc_24h_change ?? null,
    };
  },
});
