import { createAction } from '@activepieces/pieces-framework';
import { getElkProtocol } from '../common/elk-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get Elk Finance protocol metadata including name, category, supported chains, and URL.',
  auth: undefined,
  props: {},
  async run() {
    const data = await getElkProtocol();
    const chains = data.chains ?? Object.keys(data.chainTvls ?? {});
    return {
      name: data.name ?? 'Elk Finance',
      category: data.category ?? null,
      chains,
      total_chains: chains.length,
      url: data.url ?? 'https://elk.finance/',
      twitter: data.twitter ?? null,
      description: data.description ?? null,
    };
  },
});
