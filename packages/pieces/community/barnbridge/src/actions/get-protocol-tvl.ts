import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchBarnBridgeProtocol } from '../barnbridge-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get the current Total Value Locked (TVL) for BarnBridge protocol including daily and weekly changes.',
  props: {},
  async run() {
    const data = await fetchBarnBridgeProtocol();

    return {
      tvl: data.tvl ?? null,
      tvlPrevDay: data.tvlPrevDay ?? null,
      tvlPrevWeek: data.tvlPrevWeek ?? null,
      change_1d: data.change_1d ?? null,
      change_7d: data.change_7d ?? null,
    };
  },
});
