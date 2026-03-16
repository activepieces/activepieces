import { createAction } from '@activepieces/pieces-framework';
import { curveRequest } from '../curve-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get global Curve Finance protocol statistics including total TVL and volume',
  props: {},
  async run() {
    const tvlData = await curveRequest<any>('/getTVL');
    const volumeData = await curveRequest<any>('/getTotalVolume');
    return { tvl: tvlData, volume: volumeData };
  },
});
