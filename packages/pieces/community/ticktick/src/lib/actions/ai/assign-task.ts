import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickAssignTaskOutputSchema } from '../../output-schemas';

export const assignTaskAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_assign_task',
	outputSchema: ticktickAssignTaskOutputSchema,
	displayName: 'Assign Task',
	description: 'Assigns a task to a member of its project.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Assigns a task to a project member by username (from ticktick_list_project_members). The assignee must be a member of the task\'s project. Sets state, so repeating it is safe. Use ticktick_unassign_task to remove the assignee.',
		idempotent: true,
	},
	props: {
		projectId: Property.ShortText({
			displayName: 'Project ID',
			description: 'The project containing the task.',
			required: true,
		}),
		taskId: Property.ShortText({
			displayName: 'Task ID',
			required: true,
		}),
		assigneeUsername: Property.ShortText({
			displayName: 'Assignee Username',
			description: 'Username of a project member, from the List Project Members action.',
			required: true,
		}),
	},
	async run(context) {
		const { projectId, taskId, assigneeUsername } = context.propsValue;
		return await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.POST,
			resourceUri: '/task/assign',
			body: { projectId, taskId, assigneeUsername },
		});
	},
});
