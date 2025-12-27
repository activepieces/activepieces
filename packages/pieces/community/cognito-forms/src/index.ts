import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  PieceAuth,
  createPiece,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { cognitoFormsGetEntries } from './lib/actions/get-entries';
import { cognitoFormsGetEntry } from './lib/actions/get-entry';
import { cognitoFormsCreateEntry } from './lib/actions/create-entry';
import { cognitoFormsUpdateEntry } from './lib/actions/update-entry';
import { cognitoFormsDeleteEntry } from './lib/actions/delete-entry';
import { cognitoFormsGetForms } from './lib/actions/get-forms';

export const cognitoFormsAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
    To get your API key:
    1. Click your organization name in the top left corner
    2. Click Settings
    3. Go to the Integrations section
    4. Select "+ New API Key"
    5. Copy and save your API key
  `,
  required: true,
});

export const cognitoForms = createPiece({
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/cognito-forms.png',
  actions: [
    cognitoFormsGetForms,
    cognitoFormsGetEntries,
    cognitoFormsGetEntry,
    cognitoFormsCreateEntry,
    cognitoFormsUpdateEntry,
    cognitoFormsDeleteEntry,
    createCustomApiCallAction({
      baseUrl: () => 'https://www.cognitoforms.com/api',
      auth: cognitoFormsAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  displayName: 'Cognito Forms',
  description: 'Online form builder for creating forms, surveys, and registrations',
  authors: ['claude-code'],
  categories: [PieceCategory.FORMS_AND_SURVEYS],
  triggers: [],
  auth: cognitoFormsAuth,
});
