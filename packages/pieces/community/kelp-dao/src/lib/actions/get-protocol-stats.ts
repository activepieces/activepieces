import { createAction } from '@activepieces/pieces-framework';
import { fetchKelpProtocol, fetchRsEthPrice } from '../kelpdao-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetches a combined snapshot of Kelp DAO protocol TVL and rsETH token price in a single action using parallel requests.',
  props: {},
  async run() {
    const [protocol, token] = await Promise.all([
      fetchKelpProtocol(),
      fetchRsEthPrice(),
    ]);

    return {
      protocol: {
        name: protocol.name,
        tvl: protocol.tvl,
        chains: protocol.chains,
      },
      token,
      fetched_at: new Date().toISOString(),
    };
  },
});
