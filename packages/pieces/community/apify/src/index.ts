import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getDatasetItems } from './lib/actions/get-dataset-items';
import { getActors } from './lib/actions/get-actors';
import { getLastRun } from './lib/actions/get-last-run';
import { startActor } from './lib/actions/start-actor';

export const apifyAuth = PieceAuth.CustomAuth({
  description: 'Enter API key authentication details',
  props: {
    apikey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
      description:
        'Find your API key on Apify in the settings, API & Integrations section.',
    }),
  },
  // Optional Validation
  validate: async ({ auth }) => {
    if (auth) {
      return {
        valid: true,
      };
    }
    return {
      valid: false,
      error: 'Invalid Api Key',
    };
  },
  required: true,
});

export const apify = createPiece({
  displayName: 'Apify',
  description: 'Your full‑stack platform for web scraping',
  auth: apifyAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/apify.svg',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['buttonsbond'],
  actions: [getDatasetItems, getActors, getLastRun, startActor],
  triggers: [],
});
