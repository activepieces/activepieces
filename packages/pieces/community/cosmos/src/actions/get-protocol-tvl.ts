import { createAction, Property } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getCosmosProtocolTvl } from '../lib/cosmos-api';

export const getProtocolTvlAction = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description:
    'Fetch the Total Value Locked (TVL) for Cosmos Hub from DeFiLlama.',
  props: {},
  async run() {
    return getCosmosProtocolTvl();
  },
});
