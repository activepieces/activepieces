import { createAction } from '@activepieces/pieces-framework';
import { notionalRequest } from '../notional-api';

export const getLendingStats = createAction({
  name: 'get_lending_stats',
  displayName: 'Get Lending Stats',
  description: 'Get borrowed vs supplied TVL and utilization rate for Notional Finance',
  auth: undefined,
  props: {},
  async run() {
    const data = await notionalRequest('https://api.llama.fi/protocol/notional');
    const currentChainTvls = data.currentChainTvls as Record<string, number>;
    const borrowed = data.currentChainTvls
      ? Object.entries(currentChainTvls)
          .filter(([key]) => key.toLowerCase().includes('borrowed'))
          .reduce((sum, [, val]) => sum + val, 0)
      : 0;

    const totalSupplied = Object.entries(currentChainTvls)
      .filter(([key]) => !key.toLowerCase().includes('borrowed'))
      .reduce((sum, [, val]) => sum + val, 0);

    const utilizationRate =
      totalSupplied > 0 ? (borrowed / totalSupplied) * 100 : 0;

    return {
      totalBorrowed: borrowed,
      totalSupplied,
      utilizationRate: parseFloat(utilizationRate.toFixed(2)),
      chains: data.chains,
    };
  },
});
