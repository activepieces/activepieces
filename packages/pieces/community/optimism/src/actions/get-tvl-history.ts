import { createAction } from '@activepieces/pieces-framework';
import { fetchUrl } from '../lib/optimism-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Get last 30 days of historical TVL data for Optimism from DeFiLlama',
  auth: undefined,
  props: {},
  async run(_context) {
    const data = await fetchUrl('https://api.llama.fi/v2/historicalChainTvl/Optimism');

    const history = Array.isArray(data) ? data : [];
    const last30 = history.slice(-30);

    return {
      chain: 'Optimism',
      days: last30.length,
      history: last30.map((entry: Record<string, unknown>) => ({
        date: new Date((entry['date'] as number) * 1000).toISOString().split('T')[0],
        tvlUsd: entry['tvl'] ?? null,
      })),
      source: 'DeFiLlama',
    };
  },
});
