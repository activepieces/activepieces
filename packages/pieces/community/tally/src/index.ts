import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';

import { tallyAuth } from './lib/auth';
import { createFolderAction } from './lib/actions/create-folder';
import { createFormAction } from './lib/actions/create-form';
import { createWorkspaceAction } from './lib/actions/create-workspace';
import { deleteFolderAction } from './lib/actions/delete-folder';
import { deleteFormAction } from './lib/actions/delete-form';
import { deleteSubmissionAction } from './lib/actions/delete-submission';
import { deleteWorkspaceAction } from './lib/actions/delete-workspace';
import { getCurrentUserAction } from './lib/actions/get-current-user';
import { getFormAction } from './lib/actions/get-form';
import { getFormAnalyticsDimensionsAction } from './lib/actions/get-form-analytics-dimensions';
import { getFormDropOffAnalyticsAction } from './lib/actions/get-form-drop-off-analytics';
import { getFormMetricsAction } from './lib/actions/get-form-metrics';
import { getFormSubmissionAnalyticsAction } from './lib/actions/get-form-submission-analytics';
import { getFormVisitAnalyticsAction } from './lib/actions/get-form-visit-analytics';
import { getSubmissionAction } from './lib/actions/get-submission';
import { getWorkspaceAction } from './lib/actions/get-workspace';
import { listFormQuestionsAction } from './lib/actions/list-form-questions';
import { listFormsAction } from './lib/actions/list-forms';
import { listSubmissionsAction } from './lib/actions/list-submissions';
import { listWorkspaceFoldersAction } from './lib/actions/list-workspace-folders';
import { listWorkspacesAction } from './lib/actions/list-workspaces';
import { renameFolderAction } from './lib/actions/rename-folder';
import { renameWorkspaceAction } from './lib/actions/rename-workspace';
import { updateFormAction } from './lib/actions/update-form';
import { TALLY_API_BASE } from './lib/common/client';
import { newSubmissionTrigger } from './lib/triggers/new-submission';

export const tally = createPiece({
	displayName: 'Tally',
	description: 'Receive form submissions from Tally forms',
	auth: tallyAuth,
	minimumSupportedRelease: '0.86.4',
	logoUrl: 'https://cdn.activepieces.com/pieces/tally.png',
	categories: [PieceCategory.FORMS_AND_SURVEYS],
	authors: ['kishanprmr', 'abuaboud', 'bst1n'],
	actions: [
		listFormsAction,
		createFormAction,
		getFormAction,
		updateFormAction,
		deleteFormAction,
		listFormQuestionsAction,
		listSubmissionsAction,
		getSubmissionAction,
		deleteSubmissionAction,
		getFormMetricsAction,
		getFormVisitAnalyticsAction,
		getFormSubmissionAnalyticsAction,
		getFormAnalyticsDimensionsAction,
		getFormDropOffAnalyticsAction,
		listWorkspacesAction,
		createWorkspaceAction,
		getWorkspaceAction,
		renameWorkspaceAction,
		deleteWorkspaceAction,
		listWorkspaceFoldersAction,
		createFolderAction,
		renameFolderAction,
		deleteFolderAction,
		getCurrentUserAction,
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
