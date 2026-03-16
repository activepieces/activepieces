import { createAction } from '@activepieces/pieces-framework';
import { getSolidlyProtocol } from '../common/solidly-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get Solidly protocol Total Value Locked (TVL) and period-over-period changes.',
  auth: undefined,
  props: {},
  async run() {
    const data = await getSolidlyProtocol();

    return {
      tvl: data.tvl ?? null,
      change_1d: data.change_1d ?? null,
      change_7d: data.change_7d ?? null,
      change_1m: data.change_1m ?? null,
    };
  },
});
