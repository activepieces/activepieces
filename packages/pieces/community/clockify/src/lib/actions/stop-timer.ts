import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { clockifyAuth } from '../../index';
import { BASE_URL } from '../common';

export const stopTimerAction = createAction({
	auth: clockifyAuth,
	name: 'stop-timer',
	displayName: 'Stop Timer',
	description: 'Stops currently running timer on specified workspace.',
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
	},
	async run(context) {
		const { workspaceId } = context.propsValue;

		const currentUserResponse = await httpClient.sendRequest<{ id: string; email: string }>({
			method: HttpMethod.GET,
			url: BASE_URL + `/user`,
			headers: {
				'X-Api-Key': context.auth as string,
			},
		});

		const userId = currentUserResponse.body.id;

		const response = await httpClient.sendRequest({
			method: HttpMethod.PATCH,
			url: BASE_URL + `/workspaces/${workspaceId}/user/${userId}/time-entries`,
			headers: {
				'X-Api-Key': context.auth as string,
			},
			body: {
				end: new Date().toISOString(),
			},
		});

		return response.body;
	},
});
