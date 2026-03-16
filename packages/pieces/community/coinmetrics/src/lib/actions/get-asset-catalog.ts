import { createAction } from '@activepieces/pieces-framework';
import { fetchAssetCatalog } from '../common/coinmetrics-api';

export const getAssetCatalogAction = createAction({
  name: 'get_asset_catalog',
  displayName: 'Get Asset Catalog',
  description: 'List all assets supported by CoinMetrics with their IDs and full names.',
  auth: undefined,
  props: {},
  async run(_context) {
    return fetchAssetCatalog();
  },
});
