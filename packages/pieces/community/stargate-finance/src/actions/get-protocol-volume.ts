import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocolVolume } from '../lib/stargate-api';

export const getProtocolVolume = createAction({
  name: 'get_protocol_volume',
  displayName: 'Get Protocol Volume',
  description: 'Get Stargate Finance bridge volume and cross-chain transfer statistics from DeFiLlama.',
  props: {},
  async run() {
    return await fetchProtocolVolume();
  },
});
