import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { clockifyAuth } from '../../index';
import { clockifyApiCall } from '../common/client';
import { workspaceId } from '../common/props';

export const findRunningTimerAction = createAction({
	auth: clockifyAuth,
	name: 'find-running-timer',
	displayName: 'Find Running Timer',
	description: 'Finds currently running timer on specified workspace.',
	props: {
		workspaceId: workspaceId({
			displayName: 'Workspace',
			required: true,
		}),
	},
	async run(context) {
		const { workspaceId } = context.propsValue;

		const response = await clockifyApiCall({
			apiKey: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/workspaces/${workspaceId}/time-entries/status/in-progress`,
		});

		return response;
	},
});
