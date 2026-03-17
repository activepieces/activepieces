import { createAction } from '@activepieces/pieces-framework';
import { fetchEigenLayerProtocol } from '../eigenlayer-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description:
    'Fetches the current Total Value Locked (TVL) for EigenLayer from DeFiLlama.',
  props: {},
  async run() {
    const protocol = await fetchEigenLayerProtocol();

    return {
      name: protocol.name,
      tvl: protocol.tvl,
      tvl_formatted: `$${(protocol.tvl / 1e9).toFixed(2)}B`,
      chains: protocol.chains,
      chain_count: protocol.chains.length,
    };
  },
});
