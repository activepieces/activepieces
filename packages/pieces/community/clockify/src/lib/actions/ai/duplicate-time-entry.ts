import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { timeEntryOutputSchema } from '../../output-schemas';

export const duplicateTimeEntryAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_duplicate_time_entry',
	outputSchema: timeEntryOutputSchema,
	displayName: 'Duplicate Time Entry',
	description: 'Copies a time entry.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a copy of an existing time entry of a user (same times, project, task, tags and description) and returns the new entry. Defaults to the connected user. Not idempotent.',
		idempotent: false,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		userId: clockifyAiProps.userId({
			required: false,
			description: 'User ID. Empty = the connected user. Another user needs workspace admin.',
		}),
		timeEntryId: clockifyAiProps.timeEntryId({ required: true }),
	},
	async run({ auth, propsValue }) {
		const userId = propsValue.userId ?? (await clockifyApi.getCurrentUser({ auth })).id;
		return await clockifyApi.duplicateTimeEntry({
			auth,
			workspaceId: propsValue.workspaceId,
			userId,
			timeEntryId: propsValue.timeEntryId,
		});
	},
});
