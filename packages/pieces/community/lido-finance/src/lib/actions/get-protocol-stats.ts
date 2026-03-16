import { createAction } from '@activepieces/pieces-framework';
import { lidoApiGet, ProtocolStatsResponse } from '../lido-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch Lido Finance protocol statistics including total staked ETH, number of stakers, and market cap.',
  props: {},
  async run() {
    const response = await lidoApiGet<ProtocolStatsResponse>('/protocol/steth/stats');
    const data = response.data;
    return {
      totalStakers: data?.totalStakers ?? null,
      totalRewards: data?.totalRewards ?? null,
      marketCap: data?.marketCap ?? null,
      lastOracleReport: data?.lastOracleReport ?? null,
      symbol: response.meta?.symbol ?? 'stETH',
      chainId: response.meta?.chainId ?? 1,
      raw: response,
    };
  },
});
