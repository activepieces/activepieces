import { createAction } from '@activepieces/pieces-framework';
import { getElkProtocol } from '../common/elk-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get Elk Finance protocol Total Value Locked (TVL) and percentage changes over time.',
  auth: undefined,
  props: {},
  async run() {
    const data = await getElkProtocol();
    return {
      tvl: data.tvl,
      change_1d: data.change_1d ?? null,
      change_7d: data.change_7d ?? null,
      change_1m: data.change_1m ?? null,
    };
  },
});
