import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocolInfo } from '../raydium-api';

export const getProtocolInfo = createAction({
  name: 'get-protocol-info',
  displayName: 'Get Protocol Info',
  description: 'Retrieve Raydium protocol statistics including TVL, 24h trading volume, fee revenue, staked RAY, and burned RAY.',
  auth: undefined,
  props: {},
  async run() {
    const info = await fetchProtocolInfo();
    return info;
  },
});
