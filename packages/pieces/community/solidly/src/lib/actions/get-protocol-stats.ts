import { createAction } from '@activepieces/pieces-framework';
import { getSolidlyProtocol } from '../common/solidly-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get Solidly protocol metadata including name, category, supported chains, URL, and description.',
  auth: undefined,
  props: {},
  async run() {
    const data = await getSolidlyProtocol();

    return {
      name: data.name ?? null,
      category: data.category ?? null,
      chains: data.chains ?? [],
      url: data.url ?? null,
      description: data.description ?? null,
      twitter: data.twitter ?? null,
      symbol: data.symbol ?? null,
      slug: data.slug ?? null,
    };
  },
});
