import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData } from '../../sushiswap-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get SushiSwap TVL with daily and weekly changes from DeFiLlama.',
  props: {},
  async run() {
    const data = await getProtocolData();

    return {
      tvl: data.tvl,
      prevDay: data.change_1d !== undefined ? data.tvl / (1 + data.change_1d / 100) : null,
      prevWeek: data.change_7d !== undefined ? data.tvl / (1 + data.change_7d / 100) : null,
      change_1d: data.change_1d ?? null,
      change_7d: data.change_7d ?? null,
    };
  },
});
