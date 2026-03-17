import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData, formatUSD, formatPercent } from '../frax-ether-api';

export const getProtocolTvl = createAction({
  name: 'get-protocol-tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch current Frax Ether TVL from DeFiLlama with 1h/1d/7d change percentages.',
  props: {},
  async run() {
    const data = await getProtocolData();

    const currentTvl = data.tvl;
    const change1h = data.change_1h ?? null;
    const change1d = data.change_1d ?? null;
    const change7d = data.change_7d ?? null;

    return {
      protocol: data.name,
      tvl: currentTvl,
      tvl_formatted: formatUSD(currentTvl),
      change_1h: change1h,
      change_1h_formatted: formatPercent(change1h),
      change_1d: change1d,
      change_1d_formatted: formatPercent(change1d),
      change_7d: change7d,
      change_7d_formatted: formatPercent(change7d),
      category: data.category,
      chains: data.chains,
      description: data.description,
    };
  },
});
