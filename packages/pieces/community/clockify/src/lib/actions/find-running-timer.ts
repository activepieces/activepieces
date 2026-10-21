import { createAction } from '@activepieces/pieces-framework';
import { clockifyAuth } from '../auth';
import { clockifyApi } from '../common/api';
import { clockifyProps } from '../common/props';

export const findRunningTimerAction = createAction({
	auth: clockifyAuth,
	name: 'find-running-timer',
	classification: 'SEARCH',
	displayName: 'Find Running Timer',
	description: 'Finds currently running timer on specified workspace.',
	audience: 'both',
	aiMetadata: {
		description:
			'Returns the in-progress (currently running) time entries for the authenticated user on the given workspace. Use to check whether a timer is active before starting or stopping one. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyProps.workspaceId({ required: true }),
	},
	async run(context) {
		const { workspaceId } = context.propsValue;

		return await clockifyApi.listInProgressTimeEntries({ auth: context.auth, workspaceId });
	},
});
