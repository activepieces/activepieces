import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getDatasetItems } from './lib/actions/get-dataset-items';
import { runActor } from './lib/actions/run-actor';
import { createApifyClient } from './lib/common';
import { getKeyValueStoreRecord } from './lib/actions/get-key-value-store-record';
import { scrapeSingleUrl } from './lib/actions/scrape-single-url';
import { runTask } from './lib/actions/run-task';
import { watchTaskRunsTrigger } from './lib/triggers/watch-task-runs';
import { watchActorRunsTrigger } from './lib/triggers/watch-actor-runs';

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
  validate: async ({ auth }) => {
    try {
      const client = createApifyClient(auth.apikey);
      await client.user('me').get();
      return { valid: true };
    } catch (error: any) {
      if (error.statusCode === 401) {
        return {
          valid: false,
          error: 'Invalid API token. Please check your token in Apify account settings.'
        };
      }

      return {
        valid: false,
        error: 'Unable to validate API token. Please check your connection and try again.'
      };
    }
  },
  required: true,
});

export const apify = createPiece({
  displayName: 'Apify',
  description: 'Access Apify tools for web scraping, data extraction, and automation.',
  auth: apifyAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/apify.svg',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['buttonsbond'],
  actions: [getDatasetItems, runActor, runTask, getKeyValueStoreRecord, scrapeSingleUrl],
  triggers: [watchActorRunsTrigger, watchTaskRunsTrigger],
});
