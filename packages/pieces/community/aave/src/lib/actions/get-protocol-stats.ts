import { createAction } from '@activepieces/pieces-framework';
import { aaveAuth } from '../aave-auth';
import { getProtocolStats } from '../aave-api';

export const getProtocolStatsAction = createAction({
  auth: aaveAuth,
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetch aggregate Aave V3 protocol statistics including total value locked (TVL), total borrowed, and number of active reserves.',
  props: {},
  async run(context) {
    const apiKey = context.auth as string | undefined;
    const stats = await getProtocolStats(apiKey);
    return stats;
  },
});
