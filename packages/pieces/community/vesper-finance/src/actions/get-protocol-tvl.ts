import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchVesperProtocol } from '../vesper-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch current and historical TVL data for Vesper Finance from DeFiLlama.',
  props: {},
  async run() {
    const data = await fetchVesperProtocol();
    return {
      tvl: data.tvl,
      tvlPrevDay: data.tvlPrevDay,
      tvlPrevWeek: data.tvlPrevWeek,
      change_1d: data.change_1d,
      change_7d: data.change_7d,
    };
  },
});
