import { createAction } from '@activepieces/pieces-framework';
import { fetchMetricsCatalog } from '../common/coinmetrics-api';

export const getMetricsCatalogAction = createAction({
  name: 'get_metrics_catalog',
  displayName: 'Get Metrics Catalog',
  description: 'List all available CoinMetrics metrics with their names and descriptions.',
  auth: undefined,
  props: {},
  async run(_context) {
    return fetchMetricsCatalog();
  },
});
