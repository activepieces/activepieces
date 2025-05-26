import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createEntry } from './lib/actions/create-entry';
import { updateEntry } from './lib/actions/update-entry';
import { deleteEntry } from './lib/actions/delete-entry';
import { getEntryDetails } from './lib/actions/get-entry-details';


export const cognitoFormsAuth = PieceAuth.SecretText({
  displayName: 'Cognito Forms API Key',
  description: 'Enter your Cognito Forms API key',
  required: true,
});

export const cognitoForms = createPiece({
  displayName: 'Cognito Forms',
  auth: cognitoFormsAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/cognito-forms.png',
  authors: ['Sanket6652'],
  actions: [
    createEntry,
    updateEntry,
    deleteEntry,
    getEntryDetails,
  ],
  triggers: [
  
  ],
});
