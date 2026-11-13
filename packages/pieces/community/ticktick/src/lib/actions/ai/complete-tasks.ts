import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { taskFields } from '../../common/task-fields';
import { ticktickCompleteTasksOutputSchema } from '../../output-schemas';

export const completeTasksAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_complete_tasks',
	outputSchema: ticktickCompleteTasksOutputSchema,
	displayName: 'Complete Multiple Tasks',
	description: 'Completes up to 50 tasks in one project.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Completes up to 50 tasks that all belong to one project. projectId defaults to the Inbox when omitted. Returns the ids actually completed; ids missing from that list were not. Re-applying is harmless.',
		idempotent: true,
	},
	props: {
		taskIds: Property.Array({
			displayName: 'Task IDs',
			description: 'Up to 50 task IDs, all in the same project.',
			required: true,
		}),
		projectId: Property.ShortText({
			displayName: 'Project ID',
			description: 'The project the tasks belong to. Defaults to the Inbox.',
			required: false,
		}),
	},
	async run(context) {
		const { taskIds, projectId } = context.propsValue;
		const taskIdList = taskFields.toStringArray({ value: taskIds }) ?? [];
		if (taskIdList.length === 0 || taskIdList.length > 50) {
			throw new Error('Task IDs must contain between 1 and 50 ids.');
		}
		const completedTaskIds = await tickTickApiCall<string[]>({
			accessToken: context.auth.access_token,
			method: HttpMethod.POST,
			resourceUri: '/task/completeTasks',
			body: { taskIds: taskIdList, ...(projectId ? { projectId } : {}) },
		});
		return {
			success: completedTaskIds.length === taskIdList.length,
			completedTaskIds,
			completedCount: completedTaskIds.length,
			notCompletedTaskIds: taskIdList.filter((id) => !completedTaskIds.includes(id)),
		};
	},
});
