import { createAction } from '@activepieces/pieces-framework';
import { getProtocol } from '../moonwell-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description:
    'Returns TVL breakdown by chain (Base, Moonbeam, and others) for the Moonwell protocol from DeFiLlama.',
  props: {},
  async run() {
    const protocol = await getProtocol();

    const chainTvls = protocol.chainTvls || {};
    const totalTvl = protocol.tvl;

    const breakdown = Object.entries(chainTvls)
      .filter(([key]) => !key.includes('-borrowed') && !key.includes('-staking'))
      .map(([chain, tvl]) => ({
        chain,
        tvl,
        tvlFormatted: `$${(tvl as number).toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
        percentage:
          totalTvl > 0
            ? `${(((tvl as number) / totalTvl) * 100).toFixed(2)}%`
            : '0%',
      }))
      .sort((a, b) => (b.tvl as number) - (a.tvl as number));

    return {
      totalTvl,
      totalTvlFormatted: `$${totalTvl.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
      chains: protocol.chains,
      breakdown,
    };
  },
});
