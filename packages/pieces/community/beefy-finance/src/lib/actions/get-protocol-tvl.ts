import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DEFILLAMA_API_BASE_URL, BEEFY_DEFILLAMA_SLUG } from '../common';

export const getProtocolTvl = createAction({
  auth: PieceAuth.None(),
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description:
    'Fetch the current total value locked (TVL) for Beefy Finance across all supported chains via DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${DEFILLAMA_API_BASE_URL}/protocol/${BEEFY_DEFILLAMA_SLUG}`,
    });

    const data = response.body as Record<string, unknown>;

    return {
      name: data['name'],
      tvl: data['currentChainTvls'],
      totalTvl: data['tvl'],
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
      category: data['category'],
      chains: data['chains'],
      chainCount: Array.isArray(data['chains'])
        ? (data['chains'] as unknown[]).length
        : 0,
    };
  },
});
