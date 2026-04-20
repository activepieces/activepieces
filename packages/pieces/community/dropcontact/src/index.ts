import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { enrichContactAction } from './lib/actions/enrich-contact';
import { getEnrichmentRequestAction } from './lib/actions/get-enrichment-request';
import { dropcontactAuth } from './lib/auth';

export const dropcontact = createPiece({
  displayName: 'Dropcontact',
  description: 'B2B email enrichment and verification service',
  auth: dropcontactAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/dropcontact.png',
  categories: [PieceCategory.SALES_AND_CRM],
  authors: ['tarai-dl'],
  actions: [
    enrichContactAction,
    getEnrichmentRequestAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.dropcontact.io',
      auth: dropcontactAuth,
      authMapping: async (auth) => ({
        'X-Access-Token': (auth as { apiKey: string }).apiKey,
      }),
    }),
  ],
  triggers: [],
});
