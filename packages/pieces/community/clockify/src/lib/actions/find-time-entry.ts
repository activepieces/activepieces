import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { clockifyAuth } from '../../index';
import { BASE_URL } from '../common';

export const findTimeEntryAction = createAction({
	auth: clockifyAuth,
	name: 'find-time-entry',
	displayName: 'Find Time Entry',
	description: 'Finds a time entry by description, start datetime or end datetime.',
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
		projectId: Property.Dropdown({
			displayName: 'Project',
			refreshers: ['workspaceId'],
			required: false,
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
		taskId: Property.Dropdown({
			displayName: 'Task',
			refreshers: ['workspaceId', 'projectId'],
			required: false,
			options: async ({ auth, workspaceId, projectId }) => {
				if (!auth || !workspaceId || !projectId) {
					return {
						disabled: true,
						options: [],
						placeholder: 'Please connect your account first.',
					};
				}

				const response = await httpClient.sendRequest<{ id: string; name: string }[]>({
					method: HttpMethod.GET,
					url: BASE_URL + `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
					headers: {
						'X-Api-Key': auth as string,
					},
				});

				return {
					disabled: false,
					options: response.body.map((task) => ({
						label: task.name,
						value: task.id,
					})),
				};
			},
		}),
	},
	async run(context) {
		const { workspaceId, projectId, start, end, description, taskId } = context.propsValue;

		const currentUserResponse = await httpClient.sendRequest<{ id: string; email: string }>({
			method: HttpMethod.GET,
			url: BASE_URL + `/user`,
			headers: {
				'X-Api-Key': context.auth as string,
			},
		});

		const userId = currentUserResponse.body.id;

		const qs: QueryParams = {};

		if (description) qs['description'] = description;
		if (start) qs['start'] = start;
		if (end) qs['end'] = end;
		if (projectId) qs['project'] = projectId;
		if (taskId) qs['task'] = taskId;

		const response = await httpClient.sendRequest({
			method: HttpMethod.GET,
			url: BASE_URL + `/workspaces/${workspaceId}/user/${userId}/time-entries`,
			headers: {
				'X-Api-Key': context.auth as string,
			},
			queryParams: qs,
		});

		return response.body;
	},
});
