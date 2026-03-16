import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData } from '../../platypus-finance-api';

export const getProtocolTvl = createAction({
  name: 'get-protocol-tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get Platypus Finance current TVL and recent changes from DeFiLlama',
  props: {},
  async run() {
    const data = await getProtocolData();
    return { tvl: data.tvl, prevDayTvl: data.tvlPrevDay, prevWeekTvl: data.tvlPrevWeek, change1d: data.change_1d, change7d: data.change_7d };
  },
});
