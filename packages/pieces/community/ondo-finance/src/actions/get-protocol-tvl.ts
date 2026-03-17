import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface ChainTvl {
  [chain: string]: number;
}

interface ProtocolResponse {
  name: string;
  tvl: number;
  chainTvls: ChainTvl;
  chains: string[];
}

export const getProtocolTvl = createAction({
  name: 'get-protocol-tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetches the current Total Value Locked (TVL) for Ondo Finance from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<ProtocolResponse>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/ondo-finance',
    });

    const data = response.body;

    return {
      name: data.name,
      tvl: data.tvl,
      chains: data.chains,
    };
  },
});
