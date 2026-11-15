import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { changedTimeEntriesOutputSchema } from '../../output-schemas';

export const bulkDeleteTimeEntriesAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_bulk_delete_time_entries',
	outputSchema: changedTimeEntriesOutputSchema,
	displayName: 'Bulk Delete Time Entries',
	description: "Deletes several of a user's time entries.",
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes several time entries of one user in one call and returns the deleted entries. All IDs must belong to that user. Defaults to the connected user.',
		idempotent: false,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		userId: clockifyAiProps.userId({
			required: false,
			description: 'User ID. Empty = the connected user. Another user needs workspace admin.',
		}),
		timeEntryIds: clockifyAiProps.timeEntryIds({ required: true }),
	},
	async run({ auth, propsValue }) {
		const userId = propsValue.userId ?? (await clockifyApi.getCurrentUser({ auth })).id;
		const timeEntries = await clockifyApi.bulkDeleteTimeEntries({
			auth,
			workspaceId: propsValue.workspaceId,
			userId,
			timeEntryIds: propsValue.timeEntryIds.map(String),
		});
		return { timeEntries, count: timeEntries.length };
	},
});
