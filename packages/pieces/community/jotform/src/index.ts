import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { jotformAuth } from './lib/auth';
import { jotformCommon } from './lib/common';
import { getUserDetails } from './lib/actions/ai/get-user-details';
import { listForms } from './lib/actions/ai/list-forms';
import { createForm } from './lib/actions/ai/create-form';
import { bulkReplaceForms } from './lib/actions/ai/bulk-replace-forms';
import { getUserUsage } from './lib/actions/ai/get-user-usage';
import { getSystemPlan } from './lib/actions/ai/get-system-plan';
import { listAllSubmissions } from './lib/actions/ai/list-all-submissions';
import { listAllReports } from './lib/actions/ai/list-all-reports';
import { getUserHistory } from './lib/actions/ai/get-user-history';
import { getUserSettings } from './lib/actions/ai/get-user-settings';
import { updateUserSettings } from './lib/actions/ai/update-user-settings';
import { getUserSettingByKey } from './lib/actions/ai/get-user-setting-by-key';
import { getForm } from './lib/actions/ai/get-form';
import { deleteForm } from './lib/actions/ai/delete-form';
import { cloneForm } from './lib/actions/ai/clone-form';
import { listFormFiles } from './lib/actions/ai/list-form-files';
import { listFormQuestions } from './lib/actions/ai/list-form-questions';
import { addFormQuestion } from './lib/actions/ai/add-form-question';
import { getFormQuestion } from './lib/actions/ai/get-form-question';
import { updateFormQuestion } from './lib/actions/ai/update-form-question';
import { deleteFormQuestion } from './lib/actions/ai/delete-form-question';
import { bulkReplaceFormQuestions } from './lib/actions/ai/bulk-replace-form-questions';
import { getFormProperties } from './lib/actions/ai/get-form-properties';
import { updateFormProperties } from './lib/actions/ai/update-form-properties';
import { bulkReplaceFormProperties } from './lib/actions/ai/bulk-replace-form-properties';
import { getFormPropertyByKey } from './lib/actions/ai/get-form-property-by-key';
import { listFormReports } from './lib/actions/ai/list-form-reports';
import { createFormReport } from './lib/actions/ai/create-form-report';
import { listFormSubmissions } from './lib/actions/ai/list-form-submissions';
import { createFormSubmission } from './lib/actions/ai/create-form-submission';
import { bulkCreateFormSubmissions } from './lib/actions/ai/bulk-create-form-submissions';
import { getSubmission } from './lib/actions/ai/get-submission';
import { updateSubmission } from './lib/actions/ai/update-submission';
import { deleteSubmission } from './lib/actions/ai/delete-submission';
import { getReport } from './lib/actions/ai/get-report';
import { deleteReport } from './lib/actions/ai/delete-report';
import { listLabels } from './lib/actions/ai/list-labels';
import { getLabel } from './lib/actions/ai/get-label';
import { getLabelResources } from './lib/actions/ai/get-label-resources';
import { createLabel } from './lib/actions/ai/create-label';
import { updateLabel } from './lib/actions/ai/update-label';
import { addLabelResources } from './lib/actions/ai/add-label-resources';
import { removeLabelResources } from './lib/actions/ai/remove-label-resources';
import { deleteLabel } from './lib/actions/ai/delete-label';
import { newSubmission } from './lib/triggers/new-submission';

export const jotform = createPiece({
  displayName: 'Jotform',
  description: 'Create online forms and surveys',

  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/jotform.svg',
  categories: [PieceCategory.FORMS_AND_SURVEYS],
  authors: ["kishanprmr","MoShizzle","khaledmashaly","abuaboud", "PFernandez98"],
  auth: jotformAuth,
  actions: [
    getUserDetails,
    listForms,
    createForm,
    bulkReplaceForms,
    getUserUsage,
    getSystemPlan,
    listAllSubmissions,
    listAllReports,
    getUserHistory,
    getUserSettings,
    updateUserSettings,
    getUserSettingByKey,
    getForm,
    deleteForm,
    cloneForm,
    listFormFiles,
    listFormQuestions,
    addFormQuestion,
    getFormQuestion,
    updateFormQuestion,
    deleteFormQuestion,
    bulkReplaceFormQuestions,
    getFormProperties,
    updateFormProperties,
    bulkReplaceFormProperties,
    getFormPropertyByKey,
    listFormReports,
    createFormReport,
    listFormSubmissions,
    createFormSubmission,
    bulkCreateFormSubmissions,
    getSubmission,
    updateSubmission,
    deleteSubmission,
    getReport,
    deleteReport,
    listLabels,
    getLabel,
    getLabelResources,
    createLabel,
    updateLabel,
    addLabelResources,
    removeLabelResources,
    deleteLabel,
    createCustomApiCallAction({
      baseUrl: (auth) =>
        auth?
        jotformCommon.baseUrl(auth.props.region) : '',
      auth: jotformAuth,
      authMapping: async (auth) => ({
        APIKEY: auth.props.apiKey,
      }),
    }),
  ],
  triggers: [newSubmission],
});

export { jotformAuth };
