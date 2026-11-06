import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { hydratedTimeEntryOutputSchema } from '../../output-schemas';

export const getTimeEntryAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_get_time_entry',
	outputSchema: hydratedTimeEntryOutputSchema,
	displayName: 'Get Time Entry',
	description: 'Gets a time entry by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one Clockify time entry by ID: description, start, end and duration, user, project, task, tags and billable flag.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		timeEntryId: clockifyAiProps.timeEntryId({ required: true }),
		hydrated: Property.Checkbox({
			displayName: 'Include Details',
			description: 'Return project, task and tag objects instead of only their IDs. Default false.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.getTimeEntry({
			auth,
			workspaceId: propsValue.workspaceId,
			timeEntryId: propsValue.timeEntryId,
			query: clockifyUtils.toQuery({ params: { hydrated: propsValue.hydrated } }),
		});
	},
});
