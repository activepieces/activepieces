import { createAction } from '@activepieces/pieces-framework';
import { getProtocolTvl } from '../lib/osmosis-api';

export const getProtocolTvlAction = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Retrieve Osmosis Total Value Locked (TVL) data from DeFiLlama, including historical TVL, current TVL, and protocol metadata.',
  props: {},
  async run() {
    const data = await getProtocolTvl();
    return {
      name: data?.name,
      tvl: data?.tvl,
      currentChainTvls: data?.currentChainTvls,
      chains: data?.chains,
      category: data?.category,
      description: data?.description,
      url: data?.url,
      twitter: data?.twitter,
      raw: data,
    };
  },
});
