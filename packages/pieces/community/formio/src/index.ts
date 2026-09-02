import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { formioAuth } from './lib/auth';
import { createSubmission } from './lib/actions/create-submission';
import { deleteSubmission } from './lib/actions/delete-submission';
import { findSubmissions } from './lib/actions/find-submissions';
import { getForm } from './lib/actions/get-form';
import { getSubmission } from './lib/actions/get-submission';
import { listForms } from './lib/actions/list-forms';
import { updateSubmission } from './lib/actions/update-submission';
import { formioCommon } from './lib/common/client';
import { newSubmission } from './lib/triggers/new-submission';
import { newSubmissionPolling } from './lib/triggers/new-submission-polling';
import { updatedSubmission } from './lib/triggers/updated-submission';
import { updatedSubmissionPolling } from './lib/triggers/updated-submission-polling';

export const formio = createPiece({
  displayName: 'Form.io',
  description:
    'Build and manage forms and their submissions on Form.io, hosted or self-hosted',
  auth: formioAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/formio.png',
  categories: [PieceCategory.FORMS_AND_SURVEYS],
  authors: ['odaithalji'],
  actions: [
    createSubmission,
    getSubmission,
    findSubmissions,
    updateSubmission,
    deleteSubmission,
    listForms,
    getForm,
    createCustomApiCallAction({
      auth: formioAuth,
      baseUrl: (auth) =>
        auth ? formioCommon.normalizeProjectUrl(auth.props.projectUrl) : '',
      authMapping: async (auth) => ({
        'x-token': auth.props.apiKey,
      }),
    }),
  ],
  triggers: [
    newSubmission,
    updatedSubmission,
    newSubmissionPolling,
    updatedSubmissionPolling,
  ],
});
