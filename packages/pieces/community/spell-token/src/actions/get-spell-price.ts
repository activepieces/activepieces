import { createAction } from '@activepieces/pieces-framework';
import { getSpellPrice as fetchSpellPrice } from '../spell-api';

export const getSpellPrice = createAction({
  name: 'get_spell_price',
  displayName: 'Get SPELL Price',
  description: 'Fetches the current price of SPELL token in USD and BTC with 24-hour price change from CoinGecko.',
  props: {},
  async run() {
    return await fetchSpellPrice();
  },
});
