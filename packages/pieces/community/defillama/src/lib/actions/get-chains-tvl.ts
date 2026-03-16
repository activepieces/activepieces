import { createAction } from '@activepieces/pieces-framework';
import { defillamaRequest, apiUrl } from '../common/defillama-api';

interface ChainTvl {
  gecko_id: string | null;
  tvl: number;
  tokenSymbol: string | null;
  cmcId: string | null;
  name: string;
  chainId: number | null;
}

export const getChainsTvl = createAction({
  name: 'get_chains_tvl',
  displayName: 'Get Chains TVL',
  description:
    'Get all blockchain chains with their current TVL data.',
  props: {},
  async run() {
    const chains = await defillamaRequest<ChainTvl[]>(apiUrl('/v2/chains'));

    const sorted = chains.sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0));

    return {
      count: sorted.length,
      chains: sorted.map((c) => ({
        name: c.name,
        tvl: c.tvl,
        token_symbol: c.tokenSymbol,
        gecko_id: c.gecko_id,
        chain_id: c.chainId,
      })),
    };
  },
});
