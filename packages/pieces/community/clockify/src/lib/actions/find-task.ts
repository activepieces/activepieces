import { createAction, Property } from '@activepieces/pieces-framework';
import { clockifyAuth } from '../auth';
import { clockifyApi } from '../common/api';
import { clockifyProps } from '../common/props';
import { foundTasksOutputSchema } from '../output-schemas';

export const findTaskAction = createAction({
	auth: clockifyAuth,
	name: 'find-task',
	outputSchema: foundTasksOutputSchema,
	classification: 'SEARCH',
	displayName: 'Find Task',
	description: 'Finds an existing task in a specific project.',
	audience: 'human',
	aiMetadata: {
		description:
			'Searches for tasks by name within a specific Clockify project and returns matches. Toggle Exact Match for strict name matching versus a looser substring search. Use to resolve a task id or confirm a task exists before creating time entries. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyProps.workspaceId({ required: true }),
		projectId: clockifyProps.projectId({ required: true }),
		name: Property.ShortText({
			displayName: 'Task Name',
			required: true,
		}),
		exactMatch: Property.Checkbox({
			displayName: 'Exact Match ?',
			required: false,
		}),
	},
	async run(context) {
		const { workspaceId, projectId, name, exactMatch } = context.propsValue;

		return await clockifyApi.listTasks({
			auth: context.auth,
			workspaceId,
			projectId,
			query: {
				name,
				'strict-name-search': exactMatch ? 'true' : 'false',
			},
		});
	},
});
