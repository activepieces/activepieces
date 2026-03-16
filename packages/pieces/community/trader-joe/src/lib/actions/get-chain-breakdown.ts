import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData } from '../../trader-joe-api';

export const getChainBreakdown = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get Trader Joe TVL breakdown by blockchain',
  props: {},
  async run() {
    const data = await getProtocolData();
    const chains = data.chainTvls || {};
    return Object.entries(chains)
      .map(([chain, info]: [string, any]) => ({ chain, tvl: info.tvl ?? info }))
      .sort((a, b) => b.tvl - a.tvl);
  },
});
