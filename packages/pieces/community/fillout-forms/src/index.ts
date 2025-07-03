import { createPiece } from '@activepieces/pieces-framework';
import { getFormResponses } from './lib/actions/get-form-responses';
import { getSingleResponse } from './lib/actions/get-single-response';
import { findFormByTitle } from './lib/actions/find-form-by-title';
import { newFormResponse } from './lib/triggers/new-form-response';
import {
  createCustomApiCallAction,
  HttpMethod,
} from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { makeRequest } from './lib/common';

export const filloutFormsAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: ``,
  validate: async ({ auth }) => {
    try {
      await makeRequest(auth as string, HttpMethod.GET, '/forms');
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid API Key.',
      };
    }
  },
});

export const filloutForms = createPiece({
  displayName: 'Fillout-forms',
  auth: filloutFormsAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/fillout-forms.png',
  authors: ['Sanket6652'],
  actions: [
    getFormResponses,
    getSingleResponse,
    findFormByTitle,
    createCustomApiCallAction({
      auth: filloutFormsAuth,
      baseUrl: () => 'https://api.fillout.com/v1/api',
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth}`,
        };
      },
    }),
  ],
  triggers: [newFormResponse],
});
