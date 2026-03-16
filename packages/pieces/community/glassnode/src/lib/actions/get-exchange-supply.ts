import { createAction } from '@activepieces/pieces-framework';
import { glassnodeAuth } from '../../index';
import { fetchGlassnodeMetric } from '../common/glassnode-api';
import {
  assetProperty,
  intervalProperty,
  sinceProperty,
  untilProperty,
} from '../common/params';

export const getExchangeSupplyAction = createAction({
  name: 'get_exchange_supply',
  displayName: 'Get Exchange Net Position Change',
  description: 'Retrieve the net change of Bitcoin supply held on exchanges, indicating buying or selling pressure.',
  auth: glassnodeAuth,
  props: {
    asset: assetProperty,
    interval: intervalProperty,
    since: sinceProperty,
    until: untilProperty,
  },
  async run(context) {
    const { asset, interval, since, until } = context.propsValue;
    const apiKey = context.auth as string;
    return fetchGlassnodeMetric(apiKey, 'distribution/exchange_net_position_change', {
      asset,
      interval,
      since: since ?? undefined,
      until: until ?? undefined,
    });
  },
});
