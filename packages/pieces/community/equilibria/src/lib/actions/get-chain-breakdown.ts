import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaGet, EQUILIBRIA_SLUG } from '../common/defillama-api';

interface ChainTvlEntry {
  [chain: string]: number;
}

interface ProtocolResponse {
  currentChainTvls: ChainTvlEntry;
  tvl: number;
  [key: string]: unknown;
}

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get TVL by Chain',
  description:
    "Fetch the breakdown of Equilibria Finance's TVL across all supported chains from DeFiLlama.",
  props: {},
  async run() {
    const data = await defiLlamaGet<ProtocolResponse>(
      `/protocol/${EQUILIBRIA_SLUG}`
    );
    const chainTvls = data.currentChainTvls ?? {};
    const totalTvl = data.tvl ?? 0;

    const breakdown = Object.entries(chainTvls)
      .sort(([, a], [, b]) => b - a)
      .map(([chain, tvl]) => ({
        chain,
        tvl_usd: tvl,
        share_pct:
          totalTvl > 0 ? Number(((tvl / totalTvl) * 100).toFixed(2)) : 0,
      }));

    return {
      total_tvl_usd: totalTvl,
      chain_count: breakdown.length,
      chains: breakdown,
    };
  },
});
