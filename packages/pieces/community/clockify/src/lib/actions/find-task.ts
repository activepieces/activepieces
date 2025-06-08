import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { clockifyAuth } from '../../index';
import { BASE_URL } from '../common';

export const findTaskAction = createAction({
	auth: clockifyAuth,
	name: 'find-task',
	displayName: 'Find Task',
	description: 'Finds an existing task in a specific project.',
	props: {
		workspaceId: Property.Dropdown({
			displayName: 'Workspace',
			refreshers: [],
			required: true,
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						options: [],
						placeholder: 'Please connect your account first.',
					};
				}

				const response = await httpClient.sendRequest<{ id: string; name: string }[]>({
					method: HttpMethod.GET,
					url: BASE_URL + '/workspaces',
					headers: {
						'X-Api-Key': auth as string,
					},
				});

				return {
					disabled: false,
					options: response.body.map((workspace) => ({
						label: workspace.name,
						value: workspace.id,
					})),
				};
			},
		}),
		projectId: Property.Dropdown({
			displayName: 'Project',
			refreshers: ['workspaceId'],
			required: true,
			options: async ({ auth, workspaceId }) => {
				if (!auth || !workspaceId) {
					return {
						disabled: true,
						options: [],
						placeholder: 'Please connect your account first.',
					};
				}

				const response = await httpClient.sendRequest<{ id: string; name: string }[]>({
					method: HttpMethod.GET,
					url: BASE_URL + `/workspaces/${workspaceId}/projects`,
					headers: {
						'X-Api-Key': auth as string,
					},
				});

				return {
					disabled: false,
					options: response.body.map((project) => ({
						label: project.name,
						value: project.id,
					})),
				};
			},
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

		const response = await httpClient.sendRequest({
			method: HttpMethod.GET,
			url: BASE_URL + `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
			headers: {
				'X-Api-Key': context.auth as string,
			},
			queryParams: {
				name,
				'strict-name-search': exactMatch ? 'true' : 'false',
			},
		});

		return response.body;
	},
});
