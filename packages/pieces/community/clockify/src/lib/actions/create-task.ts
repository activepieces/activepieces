import { createAction, Property } from '@activepieces/pieces-framework';
import { clockifyAuth } from '../auth';
import { clockifyApi } from '../common/api';
import { clockifyProps } from '../common/props';
import { taskOutputSchema } from '../output-schemas';

export const createTaskAction = createAction({
	auth: clockifyAuth,
	name: 'create-task',
	outputSchema: taskOutputSchema,
	classification: 'WRITE',
	displayName: 'Create Task',
	description: 'Creates a new in a specific project.',
	audience: 'human',
	aiMetadata: {
		description:
			'Creates a new task inside a specific Clockify project, optionally setting a status and assignees. Requires the workspace and project to target. Not idempotent: each call creates a separate task even with identical inputs.',
		idempotent: false,
	},
	props: {
		workspaceId: clockifyProps.workspaceId({ required: true }),
		projectId: clockifyProps.projectId({ required: true }),
		name: Property.ShortText({
			displayName: 'Task Name',
			required: true,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: false,
			options: {
				disabled: false,
				options: [
					{
						label: 'Active',
						value: 'ACTIVE',
					},
					{
						label: 'Done',
						value: 'DONE',
					},
					{
						label: 'All',
						value: 'ALL',
					},
				],
			},
		}),
		assigneeIds: clockifyProps.assigneeIds({ required: false }),
	},
	async run(context) {
		const { workspaceId, projectId, name, status } = context.propsValue;
		const assigneeIds = context.propsValue.assigneeIds ?? [];

		return await clockifyApi.createTask({
			auth: context.auth,
			workspaceId,
			projectId,
			name,
			status,
			assigneeIds,
		});
	},
});
