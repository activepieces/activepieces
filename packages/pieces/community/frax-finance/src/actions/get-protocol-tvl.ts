import { createAction, Property } from '@activepieces/pieces-framework';
import { getProtocolData } from '../lib/frax-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get Frax Finance total value locked (TVL) from DeFiLlama',
  props: {},
  async run() {
    const data = await getProtocolData() as Record<string, unknown>;

    const result: Record<string, unknown> = {
      name: data['name'],
      symbol: data['symbol'],
      tvl: data['tvl'],
      currentChainTvls: data['currentChainTvls'],
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
    };

    // Get latest TVL entry
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
    if (tvlHistory && Array.isArray(tvlHistory) && tvlHistory.length > 0) {
      const latest = tvlHistory[tvlHistory.length - 1];
      result['latestTvlUSD'] = latest.totalLiquidityUSD;
      result['latestTvlDate'] = new Date(latest.date * 1000).toISOString();
    }

    return result;
  },
});
