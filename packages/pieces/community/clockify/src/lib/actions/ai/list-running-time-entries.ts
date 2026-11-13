import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { timeEntriesOutputSchema } from '../../output-schemas';

export const listRunningTimeEntriesAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_list_running_time_entries',
	outputSchema: timeEntriesOutputSchema,
	displayName: 'List Running Time Entries',
	description: 'Lists every running timer in a workspace.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists every running timer in a workspace, for all members. Needs workspace admin; for only your own running timer use List Time Entries with Running Only. Returns one page.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		page: clockifyAiProps.page({ required: false }),
		pageSize: clockifyAiProps.pageSize({ required: false }),
	},
	async run({ auth, propsValue }) {
		const timeEntries = await clockifyApi.listInProgressTimeEntries({
			auth,
			workspaceId: propsValue.workspaceId,
			query: clockifyUtils.toQuery({
				params: {
					page: propsValue.page ?? 1,
					'page-size': propsValue.pageSize ?? 50,
				},
			}),
		});
		return { timeEntries, count: timeEntries.length };
	},
});
