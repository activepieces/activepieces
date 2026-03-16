import { createAction } from '@activepieces/pieces-framework';
import { glassnodeAuth } from '../../index';
import { fetchGlassnodeMetric } from '../common/glassnode-api';
import {
  assetProperty,
  intervalProperty,
  sinceProperty,
  untilProperty,
} from '../common/params';

export const getActiveAddressesAction = createAction({
  name: 'get_active_addresses',
  displayName: 'Get Active Addresses',
  description: 'Retrieve the number of unique addresses that were active on-chain for a given asset.',
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
    return fetchGlassnodeMetric(apiKey, 'addresses/active_count', {
      asset,
      interval,
      since: since ?? undefined,
      until: until ?? undefined,
    });
  },
});
