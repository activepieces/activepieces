import { createAction, Property } from '@activepieces/pieces-framework';
import { messariAuth } from '../../index';
import { messariRequest } from '../common/messari-api';

export const getAssetMetrics = createAction({
  auth: messariAuth,
  name: 'get_asset_metrics',
  displayName: 'Get Asset Metrics',
  description: 'Get comprehensive market metrics for any crypto asset — price, volume, market cap, ATH, ROI, and supply data.',
  props: {
    asset_key: Property.ShortText({
      displayName: 'Asset Key',
      description: 'Asset slug, symbol, or ID (e.g. "bitcoin", "ethereum", "btc", "eth")',
      required: true,
      defaultValue: 'bitcoin',
    }),
  },
  async run(context) {
    return messariRequest(context.auth, 'v1', `/assets/${context.propsValue.asset_key}/metrics`);
  },
});
