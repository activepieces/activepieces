import { createAction } from '@activepieces/pieces-framework';
import { yearnApi } from '../common/yearn-api';

export const getProtocolStatsAction = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch Yearn Finance total TVL across all chains and chain-by-chain breakdown via DeFiLlama.',
  props: {},
  async run(_context) {
    return await yearnApi.getProtocolStats();
  },
});
