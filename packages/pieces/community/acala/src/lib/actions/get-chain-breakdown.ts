import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain Breakdown',
  description:
    'Fetch the TVL breakdown by chain for Acala Network from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/acala',
    });
    const data = response.body as Record<string, unknown>;
    return {
      name: data['name'],
      currentChainTvls: data['currentChainTvls'],
      chainTvls: data['chainTvls'],
      chains: data['chains'],
    };
  },
});
