import { QueryParams } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { clockifyAuth } from '../auth';
import { clockifyApi } from '../common/api';
import { clockifyProps } from '../common/props';
import { foundTimeEntriesOutputSchema } from '../output-schemas';

export const findTimeEntryAction = createAction({
	auth: clockifyAuth,
	name: 'find-time-entry',
	outputSchema: foundTimeEntriesOutputSchema,
	classification: 'SEARCH',
	displayName: 'Find Time Entry',
	description: 'Finds a time entry by description, start datetime or end datetime.',
	audience: 'human',
	aiMetadata: {
		description:
			"Searches the authenticated user's time entries on a workspace, optionally filtered by description, start/end datetime, project, or task. With no filters it returns recent entries; supplied filters narrow the results. Use to locate an existing entry or verify logged time. Read-only and idempotent.",
		idempotent: true,
	},
	props: {
		workspaceId: clockifyProps.workspaceId({ required: true }),
		start: Property.DateTime({
			displayName: 'Start Datetime',
			required: false,
		}),
		end: Property.DateTime({
			displayName: 'End Datetime',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'Entry Description',
			required: false,
		}),
		projectId: clockifyProps.projectId({ required: false }),
		taskId: clockifyProps.taskId({ required: false }),
	},
	async run(context) {
		const { workspaceId, projectId, start, end, description, taskId } = context.propsValue;

		const currentUser = await clockifyApi.getCurrentUser({ auth: context.auth });

		const qs: QueryParams = { hydrated: 'true' };

		if (description) qs['description'] = description;
		if (start) qs['start'] = start;
		if (end) qs['end'] = end;
		if (projectId) qs['project'] = projectId;
		if (taskId) qs['task'] = taskId;

		return await clockifyApi.listUserTimeEntries({
			auth: context.auth,
			workspaceId,
			userId: currentUser.id,
			query: qs,
		});
	},
});
