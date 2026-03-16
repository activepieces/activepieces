import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData } from '../../perp-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get current TVL and percentage changes for Perp Protocol from DeFiLlama.',
  props: {},
  async run() {
    const data = await getProtocolData();

    const currentTvl: number = data.tvl ?? 0;
    const prevDayTvl: number = data.currentChainTvls?.['Optimism'] ?? data.tvl ?? 0;

    // DeFiLlama provides change_1d and change_7d directly on the protocol object
    const change1d: number = data.change_1d ?? 0;
    const change7d: number = data.change_7d ?? 0;

    // prevDay and prevWeek derived from current and changes
    const prevDay = change1d !== 0 ? currentTvl / (1 + change1d / 100) : currentTvl;
    const prevWeek = change7d !== 0 ? currentTvl / (1 + change7d / 100) : currentTvl;

    return {
      tvl: currentTvl,
      prevDay,
      prevWeek,
      change_1d: change1d,
      change_7d: change7d,
    };
  },
});
