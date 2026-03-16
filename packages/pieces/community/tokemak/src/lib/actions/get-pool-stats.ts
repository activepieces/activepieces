import { createAction } from '@activepieces/pieces-framework';
import { getTokemakProtocol } from '../tokemak-api';

export const getPoolStats = createAction({
  name: 'get_pool_stats',
  displayName: 'Get Pool Stats',
  description: 'Get Tokemak protocol stats including TVL per chain, methodology and audit info',
  auth: undefined,
  props: {},
  async run() {
    const data = await getTokemakProtocol();
    const chainTvls = data.currentChainTvls || {};
    return {
      current_chain_tvls: chainTvls,
      methodology: data.methodology,
      audit_links: data.audit_links,
      oracles: data.oracles,
      category: data.category,
    };
  },
});
