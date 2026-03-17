import { createAction } from '@activepieces/pieces-framework';
import { yearnApi } from '../common/yearn-api';

export const getYfiTokenStatsAction = createAction({
  name: 'get_yfi_token_stats',
  displayName: 'Get YFI Token Stats',
  description: 'Fetch YFI governance token price, market cap, 24h volume, and supply data from CoinGecko.',
  props: {},
  async run(_context) {
    return await yearnApi.getYfiTokenStats();
  },
});
