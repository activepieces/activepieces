import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { clockifyAuth } from '../../index';
import { clockifyApiCall } from '../common/client';
import { projectId, taskId, workspaceId } from '../common/props';

export const findTimeEntryAction = createAction({
	auth: clockifyAuth,
	name: 'find-time-entry',
	displayName: 'Find Time Entry',
	description: 'Finds a time entry by description, start datetime or end datetime.',
	props: {
		workspaceId: workspaceId({
			displayName: 'Workspace',
			required: true,
		}),
		start: Property.DateTime({
			displayName: 'Start Datetime',
			required: false,
		}),
		end: Property.DateTime({
			displayName: 'End Datetime',
			required: false,
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
	},
	async run(context) {
		const { workspaceId, projectId, start, end, description, taskId } = context.propsValue;

		const currentUserResponse = await clockifyApiCall<{ id: string; email: string }>({
			apiKey: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/user`,
		});

		const userId = currentUserResponse.id;

		const qs: QueryParams = { hydrated: 'true' };

		if (description) qs['description'] = description;
		if (start) qs['start'] = start;
		if (end) qs['end'] = end;
		if (projectId) qs['project'] = projectId;
		if (taskId) qs['task'] = taskId;

		const response = await clockifyApiCall({
			apiKey: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/workspaces/${workspaceId}/user/${userId}/time-entries`,
			query: qs,
		});

		return response;
	},
});
