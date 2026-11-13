import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { tasksOutputSchema } from '../../output-schemas';

export const listTasksAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_list_tasks',
	outputSchema: tasksOutputSchema,
	displayName: 'List Tasks',
	description: 'Lists or searches the tasks of a project.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the tasks of one Clockify project, optionally filtered by name (exact or contains) or active state. Use it to find a task ID for time entries. Returns one page.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		projectId: clockifyAiProps.projectId({ required: true }),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Optional: only tasks whose name contains this text.',
			required: false,
		}),
		exactMatch: Property.Checkbox({
			displayName: 'Exact Name Match',
			description: 'Match Name exactly instead of contains. Default false.',
			required: false,
		}),
		isActive: Property.StaticDropdown({
			displayName: 'Active',
			description: 'Optional: only active (Yes) or only done (No) tasks. Empty = both.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Yes', value: 'true' },
					{ label: 'No', value: 'false' },
				],
			},
		}),
		page: clockifyAiProps.page({ required: false }),
		pageSize: clockifyAiProps.pageSize({ required: false }),
	},
	async run({ auth, propsValue }) {
		const tasks = await clockifyApi.listTasks({
			auth,
			workspaceId: propsValue.workspaceId,
			projectId: propsValue.projectId,
			query: clockifyUtils.toQuery({
				params: {
					name: propsValue.name,
					'strict-name-search': propsValue.exactMatch,
					'is-active': propsValue.isActive,
					page: propsValue.page ?? 1,
					'page-size': propsValue.pageSize ?? 50,
				},
			}),
		});
		return { tasks, count: tasks.length };
	},
});
