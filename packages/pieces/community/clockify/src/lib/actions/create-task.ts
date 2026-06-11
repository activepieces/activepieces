import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { clockifyAuth } from '../auth';
import { clockifyApiCall } from '../common/client';
import { assigneeIds, projectId, workspaceId } from '../common/props';

export const createTaskAction = createAction({
	auth: clockifyAuth,
	name: 'create-task',
	displayName: 'Create Task',
	description: 'Creates a new in a specific project.',
	audience: 'both',
	aiMetadata: {
		description:
			'Creates a new task inside a specific Clockify project, optionally setting a status and assignees. Requires the workspace and project to target. Not idempotent: each call creates a separate task even with identical inputs.',
		idempotent: false,
	},
	props: {
		workspaceId: workspaceId({
			displayName: 'Workspace',
			required: true,
		}),
		projectId: projectId({
			displayName: 'Project',
			required: true,
		}),
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
		assigneeIds: assigneeIds({
			displayName: 'Assignee',
			required: false,
		}),
	},
	async run(context) {
		const { workspaceId, projectId, name, status } = context.propsValue;
		const assigneeIds = context.propsValue.assigneeIds ?? [];

		const response = await clockifyApiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
			body: {
				name,
				status,
				assigneeIds,
			},
		});

		return response;
	},
});
