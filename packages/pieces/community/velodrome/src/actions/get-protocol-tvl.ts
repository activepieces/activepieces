import { createAction } from '@activepieces/pieces-framework';
import { fetchUrl } from '../lib/velodrome-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get Velodrome Finance total value locked (TVL) on Optimism via DeFiLlama',
  auth: undefined,
  props: {},
  async run(_context) {
    const data = await fetchUrl('https://api.llama.fi/protocol/velodrome');

    const currentTvl = data.currentChainTvls?.Optimism ?? data.tvl ?? null;
    const chainTvls = data.currentChainTvls ?? {};
    const tvlHistory = Array.isArray(data.chainTvls?.Optimism?.tvl)
      ? data.chainTvls.Optimism.tvl.slice(-7)
      : [];

    return {
      protocol: 'Velodrome Finance',
      chain: 'Optimism',
      currentTvlUsd: currentTvl,
      allChainTvls: chainTvls,
      last7DaysTvl: tvlHistory,
      source: 'DeFiLlama',
    };
  },
});
