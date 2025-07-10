import {
  createCustomApiCallAction,
  HttpMethod,
} from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { wufooApiCall } from './lib/common/client';
import { createFormEntryAction } from './lib/actions/create-form-entry';
import { findFormAction } from './lib/actions/find-form';
import { findSubmissionByFieldAction } from './lib/actions/find-submission-by-field';
import { getEntryDetailsAction } from './lib/actions/get-entry-details';
import { newFormEntryTrigger } from './lib/triggers/new-form-entry';
import { newFormTrigger } from './lib/triggers/new-form';

export const wufooAuth = PieceAuth.CustomAuth({
  description: 'Enter your Wufoo API Key and Subdomain.',
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
    subdomain: PieceAuth.SecretText({
      displayName: 'Subdomain',
      description:
        'Your Wufoo account subdomain (e.g., for fishbowl.wufoo.com, use "fishbowl")',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await wufooApiCall({
        method: HttpMethod.GET,
        auth,
        resourceUri: '/forms.json',
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key or Subdomain',
      };
    }
  },
  required: true,
});

export const wufoo = createPiece({
  displayName: 'Wufoo',
  auth: wufooAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/wufoo.png',
  authors: ['krushnarout','onyedikachi-david'],
  actions: [
    createFormEntryAction,
    findFormAction,
    findSubmissionByFieldAction,
    getEntryDetailsAction,
    createCustomApiCallAction({
      auth: wufooAuth,
      baseUrl: (auth: any) => `https://${auth.subdomain}.wufoo.com/api/v3`,
      authMapping: async (auth) => {
        const { apiKey } = auth as { apiKey: string };
        const encoded = Buffer.from(`${apiKey}:footastic`).toString('base64');
        return {
          Authorization: `Basic ${encoded}`,
        };
      },
    }),
  ],
  triggers: [newFormEntryTrigger, newFormTrigger],
});
