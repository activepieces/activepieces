import { createPiece } from '@activepieces/pieces-framework';
import { matomoAuth } from './lib/auth';
import { addAnnotationAction } from './lib/actions/add-annotation';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const matomo = createPiece({
  displayName: 'Matomo',
  auth: matomoAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/matomo.png',
  authors: ['joeworkman'],
  actions: [
    addAnnotationAction,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth as { domain: string }).domain,
      auth: matomoAuth,
      authMapping: (auth) => ({
        Authorization: `Bearer ${(auth as { tokenAuth: string }).tokenAuth}`,
      }),
    }),
  ],
  triggers: [],
});

// Matomo API Docs: https://developer.matomo.org/api-reference/reporting-api
