import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { taskOutputSchema } from '../../output-schemas';

export const updateTaskAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_update_task',
	outputSchema: taskOutputSchema,
	displayName: 'Update Task',
	description: 'Updates, completes or reopens a task.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates a task name, status (mark Done or reopen as Active), assignees, user groups, estimate or billable flag. Only the fields you set change: the action reads the task and sends the rest back unchanged. Assignee and group lists you set replace the current ones.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		projectId: clockifyAiProps.projectId({ required: true }),
		taskId: clockifyAiProps.taskId({ required: true }),
		name: Property.ShortText({ displayName: 'Name', required: false }),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Active or Done. Empty = unchanged.',
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
			description: 'Replaces the assignees. Use List Users to find them. Empty = unchanged.',
			required: false,
		}),
		userGroupIds: Property.Array({
			displayName: 'User Group IDs',
			description: 'Replaces the assigned user groups. Use List User Groups. Empty = unchanged.',
			required: false,
		}),
		estimate: Property.ShortText({
			displayName: 'Estimate',
			description: 'Time estimate as an ISO 8601 duration, for example PT8H.',
			required: false,
		}),
		billable: Property.StaticDropdown({
			displayName: 'Billable',
			description: 'Billable (Yes) or not (No). Empty = unchanged.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Yes', value: 'true' },
					{ label: 'No', value: 'false' },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		const current = await clockifyApi.getTask({
			auth,
			workspaceId: propsValue.workspaceId,
			projectId: propsValue.projectId,
			taskId: propsValue.taskId,
		});
		return await clockifyApi.updateTask({
			auth,
			workspaceId: propsValue.workspaceId,
			projectId: propsValue.projectId,
			taskId: propsValue.taskId,
			task: {
				name: propsValue.name ?? current.name,
				status: propsValue.status ?? current.status,
				assigneeIds:
					clockifyUtils.nonEmptyIds({ values: propsValue.assigneeIds }) ?? current.assigneeIds,
				userGroupIds:
					clockifyUtils.nonEmptyIds({ values: propsValue.userGroupIds }) ?? current.userGroupIds,
				estimate: propsValue.estimate ?? current.estimate,
				billable:
					clockifyUtils.toOptionalBoolean({ value: propsValue.billable }) ?? current.billable,
				budgetEstimate: current.budgetEstimate,
			},
		});
	},
});
