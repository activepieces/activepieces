import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaRequest } from '../sudoswap-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description:
    'Fetch the current Total Value Locked (TVL) for the Sudoswap NFT AMM protocol from DeFiLlama.',
  props: {},
  async run() {
    const data = await defiLlamaRequest<any>('/protocol/sudoswap');
    return {
      name: data.name,
      symbol: data.symbol,
      currentTvl: data.currentChainTvls,
      totalTvl: data.tvl?.[data.tvl.length - 1]?.totalLiquidityUSD ?? null,
      chains: data.chains,
      category: data.category,
      description: data.description,
    };
  },
});
