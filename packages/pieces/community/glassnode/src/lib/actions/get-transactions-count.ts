import { createAction } from '@activepieces/pieces-framework';
import { glassnodeAuth } from '../../index';
import { fetchGlassnodeMetric } from '../common/glassnode-api';
import {
  assetProperty,
  intervalProperty,
  sinceProperty,
  untilProperty,
} from '../common/params';

export const getTransactionsCountAction = createAction({
  name: 'get_transactions_count',
  displayName: 'Get Transactions Count',
  description:
    'Retrieve the total number of on-chain transactions for a given asset.',
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
    return fetchGlassnodeMetric(apiKey, 'transactions/count', {
      asset,
      interval,
      since: since ?? undefined,
      until: until ?? undefined,
    });
  },
});
