import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getAssetMetricsAction } from './lib/actions/get-asset-metrics';
import { getAssetCatalogAction } from './lib/actions/get-asset-catalog';
import { getMetricsCatalogAction } from './lib/actions/get-metrics-catalog';
import { getPairMetricsAction } from './lib/actions/get-pair-metrics';
import { getExchangeMetricsAction } from './lib/actions/get-exchange-metrics';

export const coinmetrics = createPiece({
  displayName: 'CoinMetrics',
  description: 'Institutional-grade crypto network data and analytics via the CoinMetrics Community API.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/coinmetrics.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    getAssetMetricsAction,
    getAssetCatalogAction,
    getMetricsCatalogAction,
    getPairMetricsAction,
    getExchangeMetricsAction,
  ],
  triggers: [],
});
