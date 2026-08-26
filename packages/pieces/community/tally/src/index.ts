import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';

import { createForm } from './lib/actions/create-form';
import { createWorkspace } from './lib/actions/create-workspace';
import { createWorkspaceFolder } from './lib/actions/create-workspace-folder';
import { deleteForm } from './lib/actions/delete-form';
import { deleteFormSubmission } from './lib/actions/delete-form-submission';
import { deleteWorkspace } from './lib/actions/delete-workspace';
import { deleteWorkspaceFolder } from './lib/actions/delete-workspace-folder';
import { getCurrentUser } from './lib/actions/get-current-user';
import { getForm } from './lib/actions/get-form';
import { getFormDimensions } from './lib/actions/get-form-dimensions';
import { getFormDropOff } from './lib/actions/get-form-drop-off';
import { getFormMetrics } from './lib/actions/get-form-metrics';
import { getFormSubmission } from './lib/actions/get-form-submission';
import { getFormSubmissionsTimeseries } from './lib/actions/get-form-submissions-timeseries';
import { getFormVisits } from './lib/actions/get-form-visits';
import { getWorkspace } from './lib/actions/get-workspace';
import { listFormQuestions } from './lib/actions/list-form-questions';
import { listFormSubmissions } from './lib/actions/list-form-submissions';
import { listForms } from './lib/actions/list-forms';
import { listWorkspaceFolders } from './lib/actions/list-workspace-folders';
import { listWorkspaces } from './lib/actions/list-workspaces';
import { updateForm } from './lib/actions/update-form';
import { updateWorkspace } from './lib/actions/update-workspace';
import { updateWorkspaceFolder } from './lib/actions/update-workspace-folder';
import { tallyAuth } from './lib/auth';
import { TALLY_API_BASE } from './lib/common/client';
import { newSubmissionTrigger } from './lib/triggers/new-submission';

export const tally = createPiece({
	displayName: 'Tally',
	description: 'Receive form submissions from Tally forms',
	auth: tallyAuth,
	minimumSupportedRelease: '0.27.1',
	logoUrl: 'https://cdn.activepieces.com/pieces/tally.png',
	categories: [PieceCategory.FORMS_AND_SURVEYS],
	authors: ['kishanprmr', 'abuaboud', 'bst1n'],
	actions: [
		getCurrentUser,
		listForms,
		getForm,
		createForm,
		updateForm,
		deleteForm,
		listFormQuestions,
		listFormSubmissions,
		getFormSubmission,
		deleteFormSubmission,
		getFormMetrics,
		getFormVisits,
		getFormSubmissionsTimeseries,
		getFormDimensions,
		getFormDropOff,
		listWorkspaces,
		createWorkspace,
		getWorkspace,
		updateWorkspace,
		deleteWorkspace,
		listWorkspaceFolders,
		createWorkspaceFolder,
		updateWorkspaceFolder,
		deleteWorkspaceFolder,
		createCustomApiCallAction({
			auth: tallyAuth,
			baseUrl: () => TALLY_API_BASE,
			authMapping: async (auth) => ({
				Authorization: `Bearer ${auth.secret_text}`,
			}),
		}),
	],
	triggers: [newSubmissionTrigger],
});
