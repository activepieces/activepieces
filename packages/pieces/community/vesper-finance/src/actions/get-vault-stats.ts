import { createAction } from '@activepieces/pieces-framework';
import { fetchVesperProtocol } from '../vesper-api';

export const getVaultStats = createAction({
  name: 'get_vault_stats',
  displayName: 'Get Vault Stats',
  description: 'Fetch metadata and stats for Vesper Finance vaults including name, description, category, chains, and TVL.',
  props: {},
  async run() {
    const data = await fetchVesperProtocol();
    return {
      name: data.name,
      description: data.description,
      category: data.category,
      chains: data.chains ?? [],
      tvl: data.tvl,
    };
  },
});
