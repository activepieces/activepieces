import { createAction } from '@activepieces/pieces-framework';
import { fetchDefiLlamaProtocol } from '../stakewise-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the total value locked (TVL) for the StakeWise protocol from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const protocol = await fetchDefiLlamaProtocol();

    return {
      name: protocol.name,
      symbol: protocol.symbol,
      tvl: protocol.tvl,
      tvlFormatted: `$${protocol.tvl.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
      chains: protocol.chains,
      chainCount: protocol.chains.length,
    };
  },
});
