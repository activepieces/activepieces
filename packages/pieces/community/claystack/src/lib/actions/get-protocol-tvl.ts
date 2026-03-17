import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocol } from '../claystack-api';

export const getProtocolTvl = createAction({
  name: 'get-protocol-tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current Total Value Locked (TVL) for ClayStack from DeFiLlama, including 1h, 1d, and 7d percentage changes.',
  auth: undefined,
  props: {},
  async run() {
    const protocol = await fetchProtocol();

    const totalTvl = Object.values(protocol.currentChainTvls).reduce(
      (sum, v) => sum + v,
      0
    );

    return {
      protocol: protocol.name,
      tvl_usd: totalTvl,
      tvl_formatted: `$${totalTvl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change_1h_pct: protocol.change_1h !== null && protocol.change_1h !== undefined ? protocol.change_1h : null,
      change_1d_pct: protocol.change_1d !== null && protocol.change_1d !== undefined ? protocol.change_1d : null,
      change_7d_pct: protocol.change_7d !== null && protocol.change_7d !== undefined ? protocol.change_7d : null,
      chains: Object.keys(protocol.currentChainTvls),
      source: 'DeFiLlama',
      url: 'https://defillama.com/protocol/claystack',
    };
  },
});
