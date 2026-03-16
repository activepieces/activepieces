import { createAction } from '@activepieces/pieces-framework';
import { glassnodeAuth } from '../../index';
import { fetchGlassnodeMetric } from '../common/glassnode-api';
import {
  assetProperty,
  intervalProperty,
  sinceProperty,
  untilProperty,
} from '../common/params';

export const getFeesMeanAction = createAction({
  name: 'get_fees_mean',
  displayName: 'Get Mean Transaction Fees',
  description:
    'Retrieve the mean transaction fee for a given asset over time.',
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
    return fetchGlassnodeMetric(apiKey, 'fees/mean', {
      asset,
      interval,
      since: since ?? undefined,
      until: until ?? undefined,
    });
  },
});
