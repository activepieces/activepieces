import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { clockifyAuth } from '../../index';
import { clockifyApiCall } from '../common/client';
import { workspaceId } from '../common/props';

export const stopTimerAction = createAction({
	auth: clockifyAuth,
	name: 'stop-timer',
	displayName: 'Stop Timer',
	description: 'Stops currently running timer on specified workspace.',
	props: {
		workspaceId: workspaceId({
			displayName: 'Workspace',
			required: true,
		}),
	},
	async run(context) {
		const { workspaceId } = context.propsValue;

		const currentUserResponse = await clockifyApiCall<{ id: string; email: string }>({
			apiKey: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/user`,
		});

		const userId = currentUserResponse.id;

		const response = await clockifyApiCall({
			apiKey: context.auth,
			method: HttpMethod.PATCH,
			resourceUri: `/workspaces/${workspaceId}/user/${userId}/time-entries`,
			body: {
				end: new Date().toISOString(),
			},
		});

		return response;
	},
});
