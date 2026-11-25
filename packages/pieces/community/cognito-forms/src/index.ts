import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createEntryAiAction } from './lib/actions/ai/create-entry-ai';
import { deleteEntryAiAction } from './lib/actions/ai/delete-entry-ai';
import { getEntryAiAction } from './lib/actions/ai/get-entry-ai';
import { updateEntryAiAction } from './lib/actions/ai/update-entry-ai';
import { customApiCallAction } from './lib/actions/custom-api-call';
import { createEntryAction } from './lib/actions/create-entry';
import { deleteEntryAction } from './lib/actions/delete-entry';
import { downloadFileAction } from './lib/actions/download-file';
import { getEntryAction } from './lib/actions/get-entry';
import { getEntryDocumentAction } from './lib/actions/get-entry-document';
import { getFormSchemaAction } from './lib/actions/get-form-schema';
import { listFormsAction } from './lib/actions/list-forms';
import { setFormAvailabilityAction } from './lib/actions/set-form-availability';
import { updateEntryAction } from './lib/actions/update-entry';
import { cognitoFormsAuth } from './lib/auth';
import { entryUpdatedTrigger } from './lib/triggers/entry-updated';
import { newEntryTrigger } from './lib/triggers/new-entry-submitted';

export const cognitoForms = createPiece({
  displayName: 'Cognito Forms',
  description: 'Online form builder for collecting and managing submissions.',
  auth: cognitoFormsAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/cognito-forms.png',
  authors: ['krushnarout', 'OdaiAhmed99'],
  categories: [PieceCategory.PRODUCTIVITY, PieceCategory.FORMS_AND_SURVEYS],
  actions: [
    createEntryAction,
    updateEntryAction,
    deleteEntryAction,
    getEntryAction,
    createEntryAiAction,
    updateEntryAiAction,
    getEntryAiAction,
    deleteEntryAiAction,
    listFormsAction,
    getFormSchemaAction,
    setFormAvailabilityAction,
    getEntryDocumentAction,
    downloadFileAction,
    customApiCallAction,
  ],
  triggers: [newEntryTrigger, entryUpdatedTrigger],
});
