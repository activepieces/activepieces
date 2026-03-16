import { createAction } from '@activepieces/pieces-framework';
import { fetchVertexProtocol } from '../vertex-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch general statistics and metadata for Vertex Protocol from DeFiLlama.',
  props: {},
  async run() {
    const data = await fetchVertexProtocol();

    return {
      name: data.name,
      description: data.description,
      category: data.category,
      chains: data.chains ?? [],
      tvl: data.tvl,
    };
  },
});
