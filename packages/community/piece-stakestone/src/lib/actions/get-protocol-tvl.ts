import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocolDetail, formatUsd } from '../stakestone-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current Total Value Locked (TVL) for StakeStone from DeFiLlama.',
  props: {},
  async run() {
    const protocol = await fetchProtocolDetail();

    return {
      tvl: protocol.tvl,
      tvlFormatted: formatUsd(protocol.tvl),
      symbol: protocol.symbol ?? 'STONE',
      chains: protocol.chains ?? [],
      change1h: protocol.change_1h ?? null,
      change1d: protocol.change_1d ?? null,
      change7d: protocol.change_7d ?? null,
      marketCap: protocol.mcap ?? null,
      marketCapFormatted: protocol.mcap ? formatUsd(protocol.mcap) : null,
      source: 'DeFiLlama',
      timestamp: new Date().toISOString(),
    };
  },
});
