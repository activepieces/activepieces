import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaRequest } from '../blast-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description:
    'Fetch the current Total Value Locked (TVL) for the Blast native-yield Ethereum L2 protocol from DeFiLlama.',
  props: {},
  async run() {
    const data = await defiLlamaRequest<Record<string, unknown>>('/protocol/blast');
    const currentTvl =
      (data as any).currentChainTvls ?? (data as any).tvl ?? null;
    return {
      name: (data as any).name,
      symbol: (data as any).symbol,
      currentTvl,
      currentChainTvls: (data as any).currentChainTvls,
      chains: (data as any).chains,
      category: (data as any).category,
      description: (data as any).description,
      url: (data as any).url,
      raw: data,
    };
  },
});
