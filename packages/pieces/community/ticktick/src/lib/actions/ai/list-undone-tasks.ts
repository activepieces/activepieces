import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { taskFields } from '../../common/task-fields';
import { ticktickSearchTasksOutputSchema } from '../../output-schemas';

export const listUndoneTasksAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_list_undone_tasks',
	outputSchema: ticktickSearchTasksOutputSchema,
	displayName: 'List Undone Tasks',
	description: 'Lists open TickTick tasks within a date range of up to 14 days.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Returns open tasks within a start/end window of at most 14 days (both required; an invalid range returns nothing). Optionally restrict to projectIds ("inbox" for the Inbox) or taskIds. Read-only.',
		idempotent: true,
	},
	props: {
		startDate: Property.DateTime({
			displayName: 'Start Date',
			required: true,
		}),
		endDate: Property.DateTime({
			displayName: 'End Date',
			description: 'Must not be before the start date, and at most 14 days after it.',
			required: true,
		}),
		projectIds: Property.Array({
			displayName: 'Project IDs',
			description: 'Only search these projects. Omit to search all, use "inbox" for the Inbox.',
			required: false,
		}),
		taskIds: Property.Array({
			displayName: 'Task IDs',
			description: 'Restrict results to these tasks.',
			required: false,
		}),
	},
	async run(context) {
		const { startDate, endDate, projectIds, taskIds } = context.propsValue;
		if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
			throw new Error('End Date must not be before Start Date.');
		}
		const projectIdList = taskFields.toStringArray({ value: projectIds });
		const taskIdList = taskFields.toStringArray({ value: taskIds });
		const tasks = await tickTickApiCall<Record<string, unknown>[]>({
			accessToken: context.auth.access_token,
			method: HttpMethod.POST,
			resourceUri: '/task/undone',
			body: {
				startDate: taskFields.formatDate({ value: startDate }),
				endDate: taskFields.formatDate({ value: endDate }),
				...(projectIdList && projectIdList.length > 0 ? { projectIds: projectIdList } : {}),
				...(taskIdList && taskIdList.length > 0 ? { taskIds: taskIdList } : {}),
			},
		});
		return { tasks, count: tasks.length };
	},
});
