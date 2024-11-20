import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { addAnnotationAction } from './lib/actions/add-annotation';
import { matomoAuth } from './lib/auth';

export const matomo = createPiece({
  displayName: 'Matomo',
  description: 'Open source alternative to Google Analytics',

  auth: matomoAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/matomo.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ["joeworkman","kishanprmr","MoShizzle","abuaboud"],
  actions: [
    addAnnotationAction,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth as { domain: string }).domain,
      auth: matomoAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { tokenAuth: string }).tokenAuth}`,
      }),
    }),
  ],
  triggers: [],
});

// Matomo API Docs: https://developer.matomo.org/api-reference/reporting-api
