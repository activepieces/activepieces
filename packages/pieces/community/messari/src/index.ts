import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { getAssetMetrics } from './lib/actions/get-asset-metrics';
import { getAllAssets } from './lib/actions/get-all-assets';
import { getAssetNews } from './lib/actions/get-asset-news';
import { getAllNews } from './lib/actions/get-all-news';
import { getAssetProfile } from './lib/actions/get-asset-profile';

export const messariAuth = PieceAuth.SecretText({
  displayName: 'Messari API Key',
  description: 'Your Messari API key. Get a free key at https://messari.io (no credit card required)',
  required: true,
});

export const messari = createPiece({
  displayName: 'Messari',
  auth: messariAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/messari.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [
    getAssetMetrics,
    getAllAssets,
    getAssetNews,
    getAllNews,
    getAssetProfile,
  ],
  triggers: [],
});
