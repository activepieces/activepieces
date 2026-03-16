import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaRequest } from '../scroll-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description:
    'Fetch current Total Value Locked (TVL) for the Scroll ZK rollup Layer-2 protocol via DeFiLlama.',
  props: {},
  async run() {
    const data = await defiLlamaRequest<Record<string, unknown>>('/protocol/scroll');

    const tvl = (data as any)?.currentChainTvls?.['Scroll'] ?? (data as any)?.tvl ?? null;

    return {
      protocol: 'Scroll',
      slug: 'scroll',
      currentTvl: tvl,
      raw: data,
    };
  },
});
