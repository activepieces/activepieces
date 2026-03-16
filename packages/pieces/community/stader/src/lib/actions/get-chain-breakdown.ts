import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DEFILLAMA_BASE_URL, STADER_PROTOCOL_SLUG } from '../common';

export const getChainBreakdown = createAction({
  auth: PieceAuth.None(),
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Get a breakdown of Stader Labs TVL by blockchain (Ethereum, Polygon, BNB Chain, etc.) using DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${DEFILLAMA_BASE_URL}/protocol/${STADER_PROTOCOL_SLUG}`,
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chainTvlsRaw = data['chainTvls'] as Record<string, unknown> | undefined;

    // Build sorted breakdown
    const breakdown: Array<{ chain: string; tvl_usd: number }> = [];
    if (currentChainTvls) {
      for (const [chain, tvl] of Object.entries(currentChainTvls)) {
        breakdown.push({ chain, tvl_usd: tvl });
      }
      breakdown.sort((a, b) => b.tvl_usd - a.tvl_usd);
    }

    // Total TVL
    const total = breakdown.reduce((sum, c) => sum + c.tvl_usd, 0);

    // Chain count from chainTvls
    const chainCount = chainTvlsRaw ? Object.keys(chainTvlsRaw).length : 0;

    return {
      total_tvl_usd: total,
      chain_count: chainCount,
      chains: breakdown,
    };
  },
});
