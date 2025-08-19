import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createEntryAction } from './lib/actions/create-entry';
import { updateEntryAction } from './lib/actions/update-entry';
import { deleteEntryAction } from './lib/actions/delete-entry';
import { getEntryAction } from './lib/actions/get-entry';
import { newEntryTrigger } from './lib/triggers/new-entry-submitted';
import { entryUpdatedTrigger } from './lib/triggers/entry-updated';
import {
  createCustomApiCallAction,
  HttpMethod,
} from '@activepieces/pieces-common';
import { makeRequest } from './lib/common';

export const cognitoFormsAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `
  1. Click your organization's name in the top left corner and then click Settings.
  2. Go to the Integrations section and select + New API Key.
  3. Make sure to copy and store your API key, as it cannot be retrieved later.
  `,
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

export const cognitoForms = createPiece({
  displayName: 'Cognito Forms',
  auth: cognitoFormsAuth,
  logoUrl: 'https://cdn.activepieces.com/pieces/cognito-forms.png',
  authors: ['krushnarout'],
  categories: [PieceCategory.PRODUCTIVITY, PieceCategory.FORMS_AND_SURVEYS],
  actions: [
    createEntryAction,
    updateEntryAction,
    deleteEntryAction,
    getEntryAction,
    createCustomApiCallAction({
      auth: cognitoFormsAuth,
      baseUrl: () => 'https://www.cognitoforms.com/api',
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth}`,
        };
      },
    }),
  ],
  triggers: [newEntryTrigger, entryUpdatedTrigger],
});
