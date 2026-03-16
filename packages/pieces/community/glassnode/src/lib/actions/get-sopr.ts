import { createAction } from '@activepieces/pieces-framework';
import { glassnodeAuth } from '../../index';
import { fetchGlassnodeMetric } from '../common/glassnode-api';
import {
  assetProperty,
  intervalProperty,
  sinceProperty,
  untilProperty,
} from '../common/params';

export const getSoprAction = createAction({
  name: 'get_sopr',
  displayName: 'Get SOPR (Spent Output Profit Ratio)',
  description: 'Retrieve the Spent Output Profit Ratio (SOPR) which indicates whether holders are selling at profit (>1) or loss (<1).',
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
    return fetchGlassnodeMetric(apiKey, 'indicators/sopr', {
      asset,
      interval,
      since: since ?? undefined,
      until: until ?? undefined,
    });
  },
});
