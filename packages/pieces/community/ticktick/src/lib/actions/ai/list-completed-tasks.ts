import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { taskFields } from '../../common/task-fields';
import { ticktickListCompletedTasksOutputSchema } from '../../output-schemas';

export const listCompletedTasksAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_list_completed_tasks',
	outputSchema: ticktickListCompletedTasksOutputSchema,
	displayName: 'List Completed Tasks',
	description: 'Lists completed TickTick tasks within a completion time range.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Returns at most 200 completed tasks, filtered by projectIds and by completion time (startDate/endDate). Use to review what was finished; use ticktick_list_tasks for open tasks. Read-only.',
		idempotent: true,
	},
	props: {
		projectIds: Property.Array({
			displayName: 'Project IDs',
			description: 'Only tasks in these projects, from the List Projects action.',
			required: false,
		}),
		startDate: Property.DateTime({
			displayName: 'Completed From',
			description: 'Only tasks completed on or after this time.',
			required: false,
		}),
		endDate: Property.DateTime({
			displayName: 'Completed To',
			description: 'Only tasks completed on or before this time.',
			required: false,
		}),
	},
	async run(context) {
		const { projectIds, startDate, endDate } = context.propsValue;
		const projectIdList = taskFields.toStringArray({ value: projectIds });
		const tasks = await tickTickApiCall<Record<string, unknown>[]>({
			accessToken: context.auth.access_token,
			method: HttpMethod.POST,
			resourceUri: '/task/completed',
			body: {
				...(projectIdList && projectIdList.length > 0 ? { projectIds: projectIdList } : {}),
				...(startDate ? { startDate: taskFields.formatDate({ value: startDate }) } : {}),
				...(endDate ? { endDate: taskFields.formatDate({ value: endDate }) } : {}),
			},
		});
		return { tasks, count: tasks.length };
	},
});
