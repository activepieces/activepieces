import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description:
    'Fetch the TVL breakdown by blockchain for Lybra Finance from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/lybra-finance',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chains = data['chains'] as string[] | undefined;

    const breakdown = currentChainTvls
      ? Object.entries(currentChainTvls)
          .filter(([, v]) => v > 0)
          .sort(([, a], [, b]) => b - a)
          .map(([chain, tvl]) => ({ chain, tvl, tvl_formatted: '$' + tvl.toLocaleString() }))
      : [];

    const totalTvl = breakdown.reduce((sum, { tvl }) => sum + tvl, 0);

    return {
      protocol: data['name'],
      total_tvl: totalTvl,
      total_tvl_formatted: '$' + totalTvl.toLocaleString(),
      chains_supported: chains ?? [],
      chain_count: breakdown.length,
      breakdown,
    };
  },
});
