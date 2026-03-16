import { createAction } from '@activepieces/pieces-framework';
import { siloRequest } from '../lib/silo-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description:
    'Get Silo Finance total value locked (TVL) across all isolated lending markets from DeFiLlama.',
  props: {},
  async run() {
    const data = await siloRequest('/protocol/silo-finance');
    return {
      name: data.name,
      tvl: data.tvl,
      chains: data.chains,
      chainTvls: data.chainTvls,
    };
  },
});
