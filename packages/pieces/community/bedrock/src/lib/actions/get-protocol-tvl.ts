import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocol } from '../bedrock-api';

export const getProtocolTvlAction = createAction({
  name: 'get-protocol-tvl',
  displayName: 'Get Protocol TVL',
  description:
    'Fetch the current Total Value Locked (TVL) for Bedrock protocol from DeFiLlama, including 1h, 1d, and 7d percentage changes.',
  props: {},
  async run() {
    const protocol = await fetchProtocol();

    return {
      name: protocol.name,
      tvl: protocol.tvl,
      tvlFormatted: `$${(protocol.tvl / 1_000_000).toFixed(2)}M`,
      change1h: protocol.change_1h !== null ? `${protocol.change_1h?.toFixed(2)}%` : 'N/A',
      change1d: protocol.change_1d !== null ? `${protocol.change_1d?.toFixed(2)}%` : 'N/A',
      change7d: protocol.change_7d !== null ? `${protocol.change_7d?.toFixed(2)}%` : 'N/A',
      change1hRaw: protocol.change_1h,
      change1dRaw: protocol.change_1d,
      change7dRaw: protocol.change_7d,
    };
  },
});
