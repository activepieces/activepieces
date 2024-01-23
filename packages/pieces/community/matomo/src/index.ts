import { createPiece } from '@activepieces/pieces-framework';
import { matomoAuth } from './lib/auth';
import { addAnnotationAction } from './lib/actions/add-annotation';

export const matomo = createPiece({
  displayName: 'Matomo',
  auth: matomoAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/matomo.png',
  authors: ['joeworkman'],
  actions: [addAnnotationAction],
  triggers: [],
});

// Matomo API Docs: https://developer.matomo.org/api-reference/reporting-api
