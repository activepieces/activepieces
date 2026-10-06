import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { typeformAuth } from './lib/auth';
import { typeformNewSubmission } from './lib/trigger/new-submission';
import { createFormAction } from './lib/actions/create-form';
import { createThemeAction } from './lib/actions/create-theme';
import { createWorkspaceAction } from './lib/actions/create-workspace';
import { deleteFormAction } from './lib/actions/delete-form';
import { deleteImageAction } from './lib/actions/delete-image';
import { deleteResponsesAction } from './lib/actions/delete-responses';
import { deleteThemeAction } from './lib/actions/delete-theme';
import { deleteWorkspaceAction } from './lib/actions/delete-workspace';
import { duplicateFormAction } from './lib/actions/duplicate-form';
import { getFormMessagesAction } from './lib/actions/get-form-messages';
import { getFormAction } from './lib/actions/get-form';
import { getImageAction } from './lib/actions/get-image';
import { getMeAction } from './lib/actions/get-me';
import { getThemeAction } from './lib/actions/get-theme';
import { getWorkspaceAction } from './lib/actions/get-workspace';
import { listFormsAction } from './lib/actions/list-forms';
import { listImagesAction } from './lib/actions/list-images';
import { listResponsesAction } from './lib/actions/list-responses';
import { listThemesAction } from './lib/actions/list-themes';
import { listWorkspacesAction } from './lib/actions/list-workspaces';
import { replaceFormAction } from './lib/actions/replace-form';
import { updateChoiceOptionsAction } from './lib/actions/update-choice-options';
import { updateFormMessagesAction } from './lib/actions/update-form-messages';
import { updateFormAction } from './lib/actions/update-form';
import { updateThemeAction } from './lib/actions/update-theme';
import { updateWorkspaceAction } from './lib/actions/update-workspace';
import { uploadImageAction } from './lib/actions/upload-image';

export { typeformAuth };

export const typeform = createPiece({
  displayName: 'Typeform',
  description: 'Create beautiful online forms and surveys',

  minimumSupportedRelease: '0.87.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/typeform.png',
  categories: [PieceCategory.FORMS_AND_SURVEYS],
  actions: [
    getMeAction,
    listFormsAction,
    getFormAction,
    createFormAction,
    updateFormAction,
    replaceFormAction,
    duplicateFormAction,
    updateChoiceOptionsAction,
    deleteFormAction,
    getFormMessagesAction,
    updateFormMessagesAction,
    listResponsesAction,
    deleteResponsesAction,
    listWorkspacesAction,
    getWorkspaceAction,
    createWorkspaceAction,
    updateWorkspaceAction,
    deleteWorkspaceAction,
    listThemesAction,
    getThemeAction,
    createThemeAction,
    updateThemeAction,
    deleteThemeAction,
    listImagesAction,
    getImageAction,
    uploadImageAction,
    deleteImageAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.typeform.com',
      auth: typeformAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.access_token}`,
      }),
    }),
  ],
  auth: typeformAuth,
  authors: ["ashrafsamhouri","kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  triggers: [typeformNewSubmission],
});
