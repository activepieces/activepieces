import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface CentrifugeProtocolResponse {
  name: string;
  tvl: number;
  chains: string[];
  chainTvls: Record<string, { tvl: number }>;
  currentChainTvls: Record<string, number>;
}

export const getProtocolTvl = createAction({
  name: 'get-protocol-tvl',
  displayName: 'Get Protocol TVL',
  description:
    'Fetch the current total value locked (TVL) for the Centrifuge protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<CentrifugeProtocolResponse>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/centrifuge',
    });

    const { name, tvl, chains, currentChainTvls } = response.body;

    return {
      name,
      tvl,
      chains,
      currentChainTvls,
    };
  },
});
