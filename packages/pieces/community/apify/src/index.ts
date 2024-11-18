import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getDatasetItems } from './lib/actions/get-dataset-items';
import { getActors } from './lib/actions/get-actors';
import { getLastRun } from './lib/actions/get-last-run';

export const apifyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description:
    'Find your API key on Apify in the settings, API & Integrations section.',
  validate: async ({ auth }) => {
    if (auth) {
      return {
        valid: true,
      };
    }
    return {
      valid: false,
      error: 'Invalid API Key',
    };
  },
});

export const apify = createPiece({
  displayName: 'Apify',
  description: 'Your full‑stack platform for web scraping',
  auth: apifyAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/apify.svg',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['buttonsbond'],
  actions: [getDatasetItems, getActors, getLastRun],
  triggers: [],
});
