import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

// Import actions
import { createRecordAction } from './lib/actions/create-record';
import { updateRecordAction } from './lib/actions/update-record';
import { findRecordAction } from './lib/actions/find-record';
import { createEntryAction } from './lib/actions/create-entry';
import { updateEntryAction } from './lib/actions/update-entry';
import { findListEntryAction } from './lib/actions/find-list-entry';
import { createNoteAction } from './lib/actions/create-note';
import { getCallTranscriptAction } from './lib/actions/get-call-transcript';
import { createTaskAction } from './lib/actions/create-task';
import { listTasksAction } from './lib/actions/list-tasks';
import { getTaskAction } from './lib/actions/get-task';
import { deleteTaskAction } from './lib/actions/delete-task';
import { updateTaskAction } from './lib/actions/update-task';

// Import triggers
import { recordCreatedTrigger } from './lib/triggers/record-created';
import { recordUpdatedTrigger } from './lib/triggers/record-updated';
import { listEntryCreatedTrigger } from './lib/triggers/list-entry-created';
import { listEntryUpdatedTrigger } from './lib/triggers/list-entry-updated';
import { callRecordingCreatedTrigger } from './lib/triggers/call-recording-created';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { BASE_URL } from './lib/common/client';
import { attioAuth } from './lib/auth';

export const attio = createPiece({
	displayName: 'Attio',
	description: 'Modern, collaborative CRM platform built to be fully customizable and real-time.',
	auth: attioAuth,
	minimumSupportedRelease: '0.36.1',
	logoUrl: 'https://cdn.activepieces.com/pieces/attio.png',
	categories: [PieceCategory.SALES_AND_CRM],
	authors: ['AnkitSharmaOnGithub', 'kishanprmr', 'onyedikachi-david'],
	actions: [
		createRecordAction,
		updateRecordAction,
		findRecordAction,
		createEntryAction,
		updateEntryAction,
		findListEntryAction,
		createNoteAction,
		getCallTranscriptAction,
		createTaskAction,
		listTasksAction,
		getTaskAction,
		deleteTaskAction,
		updateTaskAction,
		createCustomApiCallAction({
			auth: attioAuth,
			baseUrl: () => BASE_URL,
			authMapping: async (auth) => {
				return {
					Authorization: `Bearer ${auth.secret_text}`,
				};
			},
		}),
	],
	triggers: [
		recordCreatedTrigger,
		recordUpdatedTrigger,
		listEntryCreatedTrigger,
		listEntryUpdatedTrigger,
		callRecordingCreatedTrigger,
	],
});
