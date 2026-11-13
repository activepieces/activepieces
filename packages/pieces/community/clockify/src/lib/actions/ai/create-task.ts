import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { taskOutputSchema } from '../../output-schemas';

export const createTaskAiAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_create_task',
	outputSchema: taskOutputSchema,
	displayName: 'Create Task',
	description: 'Creates a task in a project.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a task in a Clockify project, optionally assigned to users or user groups with a time estimate, and returns it with its ID. Not idempotent: task names must be unique per project, so a repeat fails; use List Tasks with Exact Name Match to check first.',
		idempotent: false,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		projectId: clockifyAiProps.projectId({ required: true }),
		name: Property.ShortText({ displayName: 'Name', required: true }),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Default Active.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Active', value: 'ACTIVE' },
					{ label: 'Done', value: 'DONE' },
				],
			},
		}),
		assigneeIds: Property.Array({
			displayName: 'Assignee IDs',
			description: 'User IDs to assign. Use List Users to find them.',
			required: false,
		}),
		userGroupIds: Property.Array({
			displayName: 'User Group IDs',
			description: 'User group IDs to assign. Use List User Groups to find them.',
			required: false,
		}),
		estimate: Property.ShortText({
			displayName: 'Estimate',
			description: 'Time estimate as an ISO 8601 duration, for example PT8H.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.createTask({
			auth,
			workspaceId: propsValue.workspaceId,
			projectId: propsValue.projectId,
			name: propsValue.name,
			status: propsValue.status,
			assigneeIds: propsValue.assigneeIds?.map(String) ?? [],
			userGroupIds: propsValue.userGroupIds?.map(String),
			estimate: propsValue.estimate,
		});
	},
});
