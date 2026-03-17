import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current Total Value Locked (TVL) for the NFTX protocol from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/nftx',
    });
    const data = response.body;
    return {
      name: data['name'],
      symbol: data['symbol'],
      tvl: data['currentChainTvls'],
      totalLiquidity: (data['tvl'] as Array<{totalLiquidityUSD: number}>)?.slice(-1)[0]?.totalLiquidityUSD,
      chains: data['chains'],
      category: data['category'],
      description: data['description'],
    };
  },
});
