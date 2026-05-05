import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { deftformAuth } from './lib/auth';
import { getWorkspaceDetails } from './lib/actions/get-workspace';
import { getAllForms } from './lib/actions/get-all-forms';
import { getFormFields } from './lib/actions/get-form-fields';
import { getFormResponses } from './lib/actions/get-form-responses';
import { getSubmissionPdf } from './lib/actions/get-submission-pdf';
import { addFormResponse } from './lib/actions/add-form-response';
import { updateFormSettings } from './lib/actions/update-form-settings';
import { newFormResponseTrigger } from './lib/triggers/new-form-response';

export { deftformAuth };

export const deftform = createPiece({
    displayName: 'Deftform',
    description: 'Build powerful forms and automate your workflow with Deftform.',
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/deftform.png',
    categories: [PieceCategory.FORMS_AND_SURVEYS],
    auth: deftformAuth,
    authors: ['cumonvip1'],
    actions: [
        getWorkspaceDetails,
        getAllForms,
        getFormFields,
        getFormResponses,
        getSubmissionPdf,
        addFormResponse,
        updateFormSettings,
        createCustomApiCallAction({
            baseUrl: () => 'https://deftform.com/api/v1',
            auth: deftformAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${auth}`,
            }),
        }),
    ],
    triggers: [newFormResponseTrigger],
});
