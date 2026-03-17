import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch Mango Markets total value locked (TVL) from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/mango-markets',
    });

    const data = response.body as Record<string, unknown>;
    const chainTvls = (data['currentChainTvls'] ?? {}) as Record<string, number>;
    const totalTvl = Object.values(chainTvls).reduce((sum, v) => sum + v, 0);

    return {
      totalTvl,
      chainTvls,
      name: (data['name'] as string) ?? 'Mango Markets',
      symbol: (data['symbol'] as string) ?? 'MNGO',
      chain: (data['chain'] as string) ?? 'Solana',
    };
  },
});
