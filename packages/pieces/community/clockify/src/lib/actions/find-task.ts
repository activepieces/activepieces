import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { clockifyAuth } from '../../index';
import { clockifyApiCall } from '../common/client';
import { projectId, workspaceId } from '../common/props';

export const findTaskAction = createAction({
	auth: clockifyAuth,
	name: 'find-task',
	displayName: 'Find Task',
	description: 'Finds an existing task in a specific project.',
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
		exactMatch: Property.Checkbox({
			displayName: 'Exact Match ?',
			required: false,
		}),
	},
	async run(context) {
		const { workspaceId, projectId, name, exactMatch } = context.propsValue;

		const response = await clockifyApiCall({
			apiKey: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
			query: {
				name,
				'strict-name-search': exactMatch ? 'true' : 'false',
			},
		});

		return response;
	},
});
