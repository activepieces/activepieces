import { createAction } from '@activepieces/pieces-framework';
import { getBeethovenProtocol } from '../common/beethoven-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get Beethoven X protocol metadata including name, category, chains, and description.',
  props: {},
  async run() {
    const data = await getBeethovenProtocol();

    const chains = Object.keys(data.currentChainTvls ?? {});

    return {
      name: data.name ?? 'Beethoven X',
      slug: data.slug ?? 'beethoven-x',
      category: data.category ?? null,
      description: data.description ?? null,
      url: data.url ?? 'https://beets.fi/',
      twitter: data.twitter ?? null,
      chains,
      chainCount: chains.length,
      symbol: data.symbol ?? 'BEETS',
      gecko_id: data.gecko_id ?? 'beethoven-x',
      cmcId: data.cmcId ?? null,
      listedAt: data.listedAt ? new Date(data.listedAt * 1000).toISOString() : null,
    };
  },
});
