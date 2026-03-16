import { createAction } from '@activepieces/pieces-framework';
import { getMimPeg as fetchMimPeg } from '../spell-api';

export const getMimPeg = createAction({
  name: 'get_mim_peg',
  displayName: 'Get MIM Peg Status',
  description: 'Monitors the MIM (Magic Internet Money) stablecoin peg to USD. Returns current price, deviation from $1.00, and peg health status.',
  props: {},
  async run() {
    return await fetchMimPeg();
  },
});
