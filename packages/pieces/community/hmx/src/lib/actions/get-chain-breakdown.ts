import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { getProtocolData } from '../../hmx-api';

export const getChainBreakdown = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get HMX Protocol TVL breakdown by chain, sorted descending by TVL',
  auth: PieceAuth.None(),
  props: {},
  async run() {
    const data = await getProtocolData();
    const chainTvls = data.chainTvls || {};
    const breakdown = Object.entries(chainTvls)
      .map(([chain, info]: [string, any]) => ({
        chain,
        tvl: typeof info === 'object' ? (info.tvl ?? info) : info,
      }))
      .sort((a, b) => b.tvl - a.tvl);
    return { chains: breakdown };
  },
});
