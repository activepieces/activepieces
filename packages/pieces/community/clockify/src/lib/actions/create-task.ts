import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { clockifyAuth } from '../../index';

export const BASE_URL = 'https://api.clockify.me/api/v1';

export const createTaskAction = createAction({
	auth: clockifyAuth,
	name: 'create-task',
	displayName: 'Create Task',
	description: 'Creates a new in a specific project.',
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
					url: BASE_URL + `workspaces/${workspaceId}/projects`,
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
        name:Property.ShortText({
            displayName:'Task Name',
            required:true
        }),
	},
	async run(context) {},
});
