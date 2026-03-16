import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DEFILLAMA_BASE_URL, STADER_PROTOCOL_SLUG } from '../common';

export const getProtocolTvl = createAction({
  auth: PieceAuth.None(),
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the total value locked (TVL) across all Stader Labs protocol deployments using DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${DEFILLAMA_BASE_URL}/protocol/${STADER_PROTOCOL_SLUG}`,
    });

    const data = response.body as Record<string, unknown>;

    return {
      name: data['name'],
      symbol: data['symbol'],
      tvl: data['tvl'],
      chainTvls: data['chainTvls'],
      currentChainTvls: data['currentChainTvls'],
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
      category: data['category'],
    };
  },
});
