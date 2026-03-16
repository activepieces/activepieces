import { createAction } from '@activepieces/pieces-framework';
import { radiantRequest } from '../radiant-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description:
    'Get Radiant Capital total value locked (TVL) across all chains from DeFiLlama.',
  props: {},
  async run() {
    const data = await radiantRequest('/protocol/radiant-v2');
    return {
      name: data.name,
      tvl: data.tvl,
      chains: data.chains,
      chainTvls: data.chainTvls,
    };
  },
});
