import { createAction } from '@activepieces/pieces-framework';
import { fetchUrl } from '../lib/optimism-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get Optimism Layer-2 total value locked (TVL) from DeFiLlama',
  auth: undefined,
  props: {},
  async run(_context) {
    const data = await fetchUrl('https://api.llama.fi/protocol/optimism');

    const tvl = (data['tvl'] as number) ?? null;
    const currentChainTvls = (data['currentChainTvls'] as Record<string, number>) ?? {};

    return {
      protocol: 'Optimism',
      chain: 'Optimism',
      currentTvlUsd: tvl,
      allChainTvls: currentChainTvls,
      source: 'DeFiLlama',
    };
  },
});
