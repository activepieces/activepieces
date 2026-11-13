import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { hydratedTimeEntriesOutputSchema } from '../../output-schemas';

export const getTimeEntriesByIdsAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_get_time_entries_by_ids',
	outputSchema: hydratedTimeEntriesOutputSchema,
	displayName: 'Get Time Entries by IDs',
	description: 'Gets several time entries by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns several time entries of a workspace in one call, by their IDs. Use it instead of repeating Get Time Entry.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		timeEntryIds: clockifyAiProps.timeEntryIds({ required: true }),
		hydrated: Property.Checkbox({
			displayName: 'Include Details',
			description: 'Return project, task and tag objects instead of only their IDs. Default false.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const timeEntries = await clockifyApi.getTimeEntriesByIds({
			auth,
			workspaceId: propsValue.workspaceId,
			timeEntryIds: propsValue.timeEntryIds.map(String),
			hydrated: propsValue.hydrated,
		});
		return { timeEntries, count: timeEntries.length };
	},
});
