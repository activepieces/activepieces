import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { clockifyAuth } from '../../index';
import { clockifyApiCall } from '../common/client';
import { projectId, tagIds, taskId, workspaceId } from '../common/props';

export const startTimerAction = createAction({
	auth: clockifyAuth,
	name: 'start-timer',
	displayName: 'Start Timer',
	description: 'Starts a new time entry.',
	props: {
		workspaceId: workspaceId({
			displayName: 'Workspace',
			required: true,
		}),
		description: Property.LongText({
			displayName: 'Entry Description',
			required: false,
		}),
		projectId: projectId({
			displayName: 'Project',
			required: false,
		}),
		taskId: taskId({
			displayName: 'Task',
			required: false,
		}),
		billable: Property.Checkbox({
			displayName: 'Billable',
			required: false,
		}),
		tagIds: tagIds({
			displayName: 'Tags',
			required: false,
		}),
	},
	async run(context) {
		const { workspaceId, projectId, description, billable, taskId } = context.propsValue;
		const tagIds = context.propsValue.tagIds ?? [];

		const response = await clockifyApiCall({
			apiKey: context.auth,
			method: HttpMethod.POST,
			resourceUri: `/workspaces/${workspaceId}/time-entries`,
			body: {
				billable,
				description,
				start: new Date().toISOString(),
				projectId,
				taskId,
				tagIds,
				type: 'REGULAR',
			},
		});

		return response;
	},
});
