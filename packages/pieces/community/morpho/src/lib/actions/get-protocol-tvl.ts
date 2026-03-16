import { createAction } from '@activepieces/pieces-framework';
import { morphoRequest } from '../morpho-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get Morpho total value locked (TVL) across all markets from DeFiLlama.',
  props: {},
  async run() {
    const data = await morphoRequest('/protocol/morpho');
    return {
      name: data.name,
      tvl: data.tvl,
      chains: data.chains,
      chainTvls: data.chainTvls,
    };
  },
});
