import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { clockifyAuth } from '../../index';
import { BASE_URL } from '../common';

export const findRunningTimerAction = createAction({
	auth: clockifyAuth,
	name: 'find-running-timer',
	displayName: 'Find Running Timer',
	description: 'Finds currently running timer on specified workspace.',
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

		const response = await httpClient.sendRequest({
			method: HttpMethod.GET,
			url: BASE_URL + `/workspaces/${workspaceId}/time-entries/status/in-progress`,
			headers: {
				'X-Api-Key': context.auth as string,
			},
		});

		return response.body;
	},
});
