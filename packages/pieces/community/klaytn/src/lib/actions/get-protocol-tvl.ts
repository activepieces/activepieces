import { createAction } from '@activepieces/pieces-framework';
import { fetchDefiLlama } from '../klaytn-api';

export const getProtocolTvlAction = createAction({
  auth: undefined,
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description:
    'Fetch the current Total Value Locked (TVL) for the Klaytn protocol from DeFiLlama.',
  props: {},
  async run() {
    const data = await fetchDefiLlama<{ tvl: number; currentChainTvls: Record<string, number> }>(
      '/protocol/klaytn'
    );
    return data;
  },
});
