import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { AERODROME_API, BASE_CHAIN_NAME } from '../lib/aerodrome-api';

export const getChainStats = createAction({
  name: 'get_chain_stats',
  displayName: 'Get Base Chain Stats',
  description: 'Get Base chain DeFi stats (TVL, etc.) from DeFiLlama',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: AERODROME_API.DEFILLAMA_CHAINS,
    });

    const chains: any[] = response.body ?? [];
    const baseChain = chains.find(
      (chain: any) =>
        chain.name?.toLowerCase() === BASE_CHAIN_NAME.toLowerCase(),
    );

    if (!baseChain) {
      return { error: 'Base chain not found in DeFiLlama response' };
    }

    return baseChain;
  },
});
