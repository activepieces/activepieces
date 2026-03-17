import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocolData } from '../etherfi-api';

export const getProtocolTvl = createAction({
  name: 'get-protocol-tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current Total Value Locked (TVL) for the Ether.fi protocol from DeFiLlama.',
  props: {},
  async run() {
    const data = await fetchProtocolData();
    return {
      name: data.name,
      tvl: data.tvl,
      chains: data.chains,
    };
  },
});
