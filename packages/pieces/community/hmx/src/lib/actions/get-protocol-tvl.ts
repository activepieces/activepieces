import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { getProtocolData } from '../../hmx-api';

export const getProtocolTvl = createAction({
  name: 'get-protocol-tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get HMX Protocol total value locked from DeFiLlama',
  auth: PieceAuth.None(),
  props: {},
  async run() {
    const data = await getProtocolData();
    return {
      tvl: data.tvl,
      prevDayTvl: data.tvl - (data.change_1d || 0) * data.tvl / 100,
      prevWeekTvl: data.tvl - (data.change_7d || 0) * data.tvl / 100,
      change_1d: data.change_1d,
      change_7d: data.change_7d,
    };
  },
});
