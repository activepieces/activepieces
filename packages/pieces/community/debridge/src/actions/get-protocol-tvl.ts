import { createAction } from '@activepieces/pieces-framework';
import { debridgeRequest } from '../lib/debridge-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get deBridge total value locked across all chains from DeFiLlama',
  props: {},
  async run() {
    const data = await debridgeRequest('/protocol/debridge');
    return {
      name: data.name,
      tvl: data.tvl,
      chains: data.chains,
      chainTvls: data.chainTvls,
    };
  },
});
