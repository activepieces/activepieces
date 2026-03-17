import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocolData } from '../liquid-collective-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description:
    'Fetch the current Total Value Locked (TVL) for the Liquid Collective protocol from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const protocol = await fetchProtocolData();

    return {
      name: protocol.name,
      symbol: protocol.symbol,
      tvl: protocol.tvl,
      tvlFormatted: `$${protocol.tvl.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
      chains: protocol.chains ?? [],
      chainCount: (protocol.chains ?? []).length,
    };
  },
});
