import { createAction } from '@activepieces/pieces-framework';
import { getLusdPrice } from '../liquity-api';

export const getLusdPegAction = createAction({
  name: 'get_lusd_peg',
  displayName: 'Get LUSD Peg Status',
  description: 'Fetch the current LUSD stablecoin price from CoinGecko, showing deviation from the $1 peg and 24h change. Useful for monitoring de-peg events.',
  props: {},
  async run() {
    return await getLusdPrice();
  },
});
