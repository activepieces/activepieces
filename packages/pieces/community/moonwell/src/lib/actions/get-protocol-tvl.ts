import { createAction } from '@activepieces/pieces-framework';
import { getProtocol } from '../moonwell-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description:
    'Fetches the current Total Value Locked (TVL) for Moonwell from DeFiLlama, including 1h, 1d, and 7d percentage changes.',
  props: {},
  async run() {
    const protocol = await getProtocol();

    return {
      name: protocol.name,
      tvl: protocol.tvl,
      tvlFormatted: `$${protocol.tvl.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
      change_1h: protocol.change_1h,
      change_1d: protocol.change_1d,
      change_7d: protocol.change_7d,
      chain: protocol.chain,
      chains: protocol.chains,
      category: protocol.category,
      symbol: protocol.symbol,
      url: protocol.url,
    };
  },
});
