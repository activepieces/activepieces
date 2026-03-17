import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData, formatUSD, formatChange } from '../curve-finance-api';

export const getProtocolTvlAction = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetches the current Total Value Locked (TVL) for Curve Finance from DeFiLlama, including 1h, 1d, and 7d changes.',
  props: {},
  async run() {
    const data = await getProtocolData();
    return {
      name: data.name,
      symbol: data.symbol,
      tvl: data.tvl,
      tvlFormatted: formatUSD(data.tvl),
      change_1h: data.change_1h,
      change_1hFormatted: formatChange(data.change_1h),
      change_1d: data.change_1d,
      change_1dFormatted: formatChange(data.change_1d),
      change_7d: data.change_7d,
      change_7dFormatted: formatChange(data.change_7d),
    };
  },
});
