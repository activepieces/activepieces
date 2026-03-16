import { createAction } from '@activepieces/pieces-framework';
import { ribbonRequest } from '../ribbon-api';

export const getVaultStats = createAction({
  name: 'get_vault_stats',
  displayName: 'Get Vault Stats',
  description: 'Retrieve Ribbon Finance vault statistics and pool data from DeFiLlama.',
  props: {},
  async run() {
    const data = await ribbonRequest('https://api.llama.fi/protocol/ribbon');

    const pools: Array<Record<string, unknown>> = data.pools ?? [];
    const vaults = pools.map((pool: Record<string, unknown>) => ({
      pool: pool['pool'],
      chain: pool['chain'],
      project: pool['project'],
      symbol: pool['symbol'],
      tvlUsd: pool['tvlUsd'],
      apy: pool['apy'],
      apyBase: pool['apyBase'],
      apyReward: pool['apyReward'],
    }));

    return {
      total_tvl: data.tvl,
      vault_count: vaults.length,
      vaults,
    };
  },
});
