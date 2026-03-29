import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { clockifyAuth } from '../auth';
import { clockifyApiCall } from '../common/client';
import { projectId, tagIds, taskId, workspaceId } from '../common/props';

export const createTimeEntry = createAction({
	auth: clockifyAuth,
	name: 'create-time-entry',
	displayName: 'Create Time Entry',
	description: 'Creates a completed time entry with start and end times.',
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
		start: Property.DateTime({
			displayName: 'Start Time',
			required: true,
		}),
		end: Property.DateTime({
			displayName: 'End Time',
			required: true,
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
		const { workspaceId, projectId, description, billable, taskId, start, end } = context.propsValue;
		const tagIds = context.propsValue.tagIds ?? [];

		const response = await clockifyApiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/workspaces/${workspaceId}/time-entries`,
			body: {
				billable,
				description,
				start,
				end,
				projectId,
				taskId,
				tagIds,
				type: 'REGULAR',
			},
		});

		return response;
	},
});
