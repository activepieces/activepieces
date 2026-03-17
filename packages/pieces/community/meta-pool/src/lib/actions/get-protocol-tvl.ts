import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocolTvl } from '../meta-pool-api';

export const getProtocolTvl = createAction({
  name: 'get-protocol-tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get the current Total Value Locked (TVL) for Meta Pool from DeFiLlama, including 1h, 1d, and 7d percentage changes.',
  props: {},
  async run() {
    const data = await fetchProtocolTvl();

    const totalTvl = Object.values(data.currentChainTvls ?? {}).reduce((a, b) => a + b, 0);

    return {
      protocol: data.name,
      symbol: data.symbol,
      tvl_usd: totalTvl,
      tvl_formatted: `$${totalTvl.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      change_1h_pct: data.change_1h ?? null,
      change_1d_pct: data.change_1d ?? null,
      change_7d_pct: data.change_7d ?? null,
      chains: Object.keys(data.currentChainTvls ?? {}),
      url: data.url,
      fetched_at: new Date().toISOString(),
    };
  },
});
