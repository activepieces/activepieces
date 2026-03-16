import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchVertexProtocol } from '../vertex-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current and historical TVL metrics for Vertex Protocol from DeFiLlama.',
  props: {},
  async run() {
    const data = await fetchVertexProtocol();

    return {
      tvl: data.tvl,
      tvlPrevDay: data.tvlPrevDay,
      tvlPrevWeek: data.tvlPrevWeek,
      change_1d: data.change_1d,
      change_7d: data.change_7d,
    };
  },
});
