import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { clockifyAuth } from '../auth';
import { clockifyApiCall } from '../common/client';
import { workspaceId } from '../common/props';

export const stopTimerAction = createAction({
	auth: clockifyAuth,
	name: 'stop-timer',
	displayName: 'Stop Timer',
	description: 'Stops currently running timer on specified workspace.',
	audience: 'both',
	aiMetadata: {
		description:
			"Stops the authenticated user's currently running timer on the given workspace by setting its end time to now. Use after Start Timer to finalize tracked work. Not idempotent in effect: if no timer is running there is nothing to stop, and the stopped time depends on when it is called.",
		idempotent: false,
	},
	props: {
		workspaceId: workspaceId({
			displayName: 'Workspace',
			required: true,
		}),
	},
	async run(context) {
		const { workspaceId } = context.propsValue;

		const currentUserResponse = await clockifyApiCall<{ id: string; email: string }>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/user`,
		});

		const userId = currentUserResponse.id;

		const response = await clockifyApiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.PATCH,
			resourceUri: `/workspaces/${workspaceId}/user/${userId}/time-entries`,
			body: {
				end: new Date().toISOString(),
			},
		});

		return response;
	},
});
