import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { clockifyAuth } from '../../index';
import { clockifyApiCall } from '../common/client';
import { assigneeIds, projectId, workspaceId } from '../common/props';

export const createTaskAction = createAction({
	auth: clockifyAuth,
	name: 'create-task',
	displayName: 'Create Task',
	description: 'Creates a new in a specific project.',
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
			apiKey: context.auth,
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
