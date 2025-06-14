import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createEntryAction } from './lib/actions/create-entry';
import { updateEntryAction } from './lib/actions/update-entry';
import { deleteEntryAction } from './lib/actions/delete-entry';
import { getEntryDetailsAction } from './lib/actions/get-entry-details';
import { newEntrySubmittedTrigger } from './lib/triggers/new-entry-submitted';
import { entryUpdatedTrigger } from './lib/triggers/entry-updated';

export const cognitoFormsAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Enter your Cognito Forms API Key.',
});

export const cognitoForms = createPiece({
  displayName: 'Cognito Forms',
  description: 'Submit and manage form entries in Cognito Forms',
  auth: cognitoFormsAuth,
  logoUrl: 'https://www.cognitoforms.com/favicon.ico',
  authors: ['krushnarout'],
  categories: [PieceCategory.PRODUCTIVITY],
  actions: [createEntryAction, updateEntryAction, deleteEntryAction, getEntryDetailsAction],
  triggers: [newEntrySubmittedTrigger, entryUpdatedTrigger],
});
