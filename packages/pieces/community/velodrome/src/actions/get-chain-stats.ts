import { createAction } from '@activepieces/pieces-framework';
import { fetchUrl } from '../lib/velodrome-api';

export const getChainStats = createAction({
  name: 'get_chain_stats',
  displayName: 'Get Chain Stats',
  description: 'Get Optimism chain statistics from DeFiLlama (where Velodrome operates)',
  auth: undefined,
  props: {},
  async run(_context) {
    const chains = await fetchUrl('https://api.llama.fi/v2/chains');

    const optimism = (chains as any[]).find(
      (c: any) => c.name?.toLowerCase() === 'optimism'
    );

    if (!optimism) {
      return { error: 'Optimism chain data not found', source: 'DeFiLlama' };
    }

    return {
      chain: 'Optimism',
      tvlUsd: optimism.tvl,
      tokenSymbol: optimism.tokenSymbol ?? 'ETH',
      chainId: optimism.chainId ?? null,
      cmcId: optimism.cmcId ?? null,
      gecko_id: optimism.gecko_id ?? null,
      source: 'DeFiLlama',
    };
  },
});
